// ==================================
// Fraud Detection Service
// ==================================

import { db } from '@/lib/db';
import { FraudDetectionResult } from '../ad-networks/types';
import { deviceFingerprintService } from './device-fingerprint.service';
import { FraudDetectionType } from '@/../generated/prisma';

/**
 * Fraud detection and prevention
 */
export class FraudDetectorService {
    private readonly RAPID_COMPLETION_THRESHOLD = 5000; // 5 seconds (too fast)
    private readonly DAILY_EARNING_SPIKE_MULTIPLIER = 5; // 5x normal = suspicious
    private readonly MAX_ADS_PER_HOUR = 20;

    /**
     * Analyze ad completion for fraud
     */
    async analyzeAdCompletion(data: {
        userId: string;
        adId: string;
        viewDuration?: number;
        expectedDuration?: number;
        ipAddress?: string;
        deviceFingerprint?: string;
    }): Promise<FraudDetectionResult> {
        const reasons: string[] = [];
        let confidence = 0;
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';

        // Check 1: Rapid completion
        if (data.viewDuration && data.expectedDuration) {
            if (data.viewDuration < this.RAPID_COMPLETION_THRESHOLD) {
                reasons.push('Ad completed too quickly (under 5 seconds)');
                confidence += 30;
                severity = 'HIGH';

                await this.logFraudEvent({
                    userId: data.userId,
                    type: 'RAPID_COMPLETION',
                    severity: 'HIGH',
                    description: `Ad completed in ${data.viewDuration}ms (expected ${data.expectedDuration}s)`,
                    evidence: JSON.stringify({ adId: data.adId, viewDuration: data.viewDuration }),
                    ipAddress: data.ipAddress,
                    fingerprint: data.deviceFingerprint,
                });
            } else if (data.viewDuration < data.expectedDuration * 0.8 * 1000) {
                reasons.push('Ad not watched for minimum duration');
                confidence += 15;
                severity = 'MEDIUM';
            }
        }

        // Check 2: Device fingerprint collision
        if (data.deviceFingerprint) {
            const fpCheck = await deviceFingerprintService.checkDuplicateFingerprints(
                data.deviceFingerprint,
                data.userId
            );

            if (fpCheck.hasDuplicates) {
                reasons.push(`Device fingerprint matches ${fpCheck.userIds.length} other account(s)`);
                confidence += 25;
                severity = ['CRITICAL', 'HIGH'].includes(severity) ? severity : 'HIGH';

                await this.logFraudEvent({
                    userId: data.userId,
                    type: 'DEVICE_COLLISION',
                    severity: 'HIGH',
                    description: `Device fingerprint collision with ${fpCheck.userIds.length} accounts`,
                    evidence: JSON.stringify({ fingerprint: data.deviceFingerprint, otherUsers: fpCheck.userIds }),
                    fingerprint: data.deviceFingerprint,
                });
            }
        }

        // Check 3: IP pattern
        if (data.ipAddress) {
            const ipCheck = await deviceFingerprintService.checkIpPattern(data.ipAddress, data.userId);

            if (ipCheck.hasSuspiciousPattern) {
                reasons.push(`${ipCheck.userCount} accounts from same IP in last 24h`);
                confidence += 20;
                severity = ['CRITICAL', 'HIGH'].includes(severity) ? severity : 'HIGH';

                await this.logFraudEvent({
                    userId: data.userId,
                    type: 'IP_PATTERN',
                    severity: 'MEDIUM',
                    description: `${ipCheck.userCount} accounts from IP ${data.ipAddress}`,
                    evidence: JSON.stringify({ ipAddress: data.ipAddress, userCount: ipCheck.userCount }),
                    ipAddress: data.ipAddress,
                });
            }
        }

        // Check 4: Hourly rate limit
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentAds = await db.adImpression.count({
            where: {
                userId: data.userId,
                completed: true,
                createdAt: { gte: hourAgo },
            },
        });

        if (recentAds >= this.MAX_ADS_PER_HOUR) {
            reasons.push(`Rate limit exceeded: ${recentAds} ads in last hour`);
            confidence += 35;
            severity = 'CRITICAL';

            await this.logFraudEvent({
                userId: data.userId,
                type: 'EARNING_SPIKE',
                severity: 'CRITICAL',
                description: `${recentAds} ads watched in last hour (limit: ${this.MAX_ADS_PER_HOUR})`,
                evidence: JSON.stringify({ hourlyCount: recentAds }),
            });
        }

        // Check 5: Daily earning spike
        const user = await db.user.findUnique({
            where: { id: data.userId },
            select: { todaysEarnings: true, totalEarnings: true, createdAt: true },
        });

        if (user) {
            const accountAgeDays = Math.max(
                1,
                Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            );
            const averageDailyEarnings = user.totalEarnings / accountAgeDays;

            if (
                user.todaysEarnings > averageDailyEarnings * this.DAILY_EARNING_SPIKE_MULTIPLIER &&
                user.todaysEarnings > 10 // Only flag if significant amount
            ) {
                reasons.push(
                    `Today's earnings (${user.todaysEarnings.toFixed(2)}) are ${this.DAILY_EARNING_SPIKE_MULTIPLIER}x average`
                );
                confidence += 25;
                severity = ['CRITICAL', 'HIGH'].includes(severity) ? severity : 'HIGH';

                await this.logFraudEvent({
                    userId: data.userId,
                    type: 'EARNING_SPIKE',
                    severity: 'HIGH',
                    description: `Earnings spike detected`,
                    evidence: JSON.stringify({
                        todaysEarnings: user.todaysEarnings,
                        averageDaily: averageDailyEarnings,
                    }),
                });
            }
        }

        const isFraudulent = confidence >= 30;
        const shouldBlock = confidence >= 50 || severity === 'CRITICAL';

        return {
            isFraudulent,
            confidence: Math.min(100, confidence),
            reasons,
            severity,
            shouldBlock,
        };
    }

    /**
     * Log fraud event to database
     */
    private async logFraudEvent(data: {
        userId: string;
        type: FraudDetectionType;
        severity: string;
        description: string;
        evidence?: string;
        ipAddress?: string;
        fingerprint?: string;
    }): Promise<void> {
        await db.fraudDetection.create({
            data: {
                userId: data.userId,
                type: data.type,
                severity: data.severity,
                description: data.description,
                evidence: data.evidence,
                ipAddress: data.ipAddress,
                fingerprint: data.fingerprint,
            },
        });
    }

    /**
     * Check if user is currently flagged/blocked
     */
    async isUserBlocked(userId: string): Promise<boolean> {
        const recentFlags = await db.fraudDetection.count({
            where: {
                userId,
                severity: 'CRITICAL',
                resolved: false,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            },
        });

        return recentFlags >= 3; // 3+ critical flags = blocked
    }
}

export const fraudDetectorService = new FraudDetectorService();
