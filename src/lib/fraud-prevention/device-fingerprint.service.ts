// ==================================
// Device Fingerprinting Service
// ==================================

import { db } from '@/lib/db';
import { DeviceFingerprintData } from '../ad-networks/types';
import { createHash } from 'crypto';

/**
 * Device fingerprinting for fraud detection
 */
export class DeviceFingerprintService {
    /**
     * Generate fingerprint hash from device characteristics
     */
    generateFingerprint(data: {
        userAgent: string;
        screenRes?: string;
        timezone?: string;
        language?: string;
        platform?: string;
        additional?: Record<string, any>;
    }): string {
        const components = [
            data.userAgent,
            data.screenRes || '',
            data.timezone || '',
            data.language || '',
            data.platform || '',
            JSON.stringify(data.additional || {}),
        ];

        const combined = components.join('|');
        return createHash('sha256').update(combined).digest('hex');
    }

    /**
     * Save device fingerprint for user
     */
    async saveFingerprint(data: DeviceFingerprintData): Promise<void> {
        await db.deviceFingerprint.upsert({
            where: {
                userId_fingerprint: {
                    userId: data.userId,
                    fingerprint: data.fingerprint,
                },
            },
            create: {
                userId: data.userId,
                fingerprint: data.fingerprint,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                screenRes: data.screenRes,
                timezone: data.timezone,
                language: data.language,
                platform: data.platform,
                metadata: data.additional ? JSON.stringify(data.additional) : null,
            },
            update: {
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                screenRes: data.screenRes,
                timezone: data.timezone,
                language: data.language,
                platform: data.platform,
                metadata: data.additional ? JSON.stringify(data.additional) : null,
                updatedAt: new Date(),
            },
        });
    }

    /**
     * Check for duplicate fingerprints (potential multi-accounting)
     */
    async checkDuplicateFingerprints(
        fingerprint: string,
        currentUserId: string
    ): Promise<{
        hasDuplicates: boolean;
        userIds: string[];
    }> {
        const duplicates = await db.deviceFingerprint.findMany({
            where: {
                fingerprint,
                userId: { not: currentUserId },
            },
            select: { userId: true },
        });

        return {
            hasDuplicates: duplicates.length > 0,
            userIds: duplicates.map((d) => d.userId),
        };
    }

    /**
     * Check for IP address pattern (multiple accounts from same IP)
     */
    async checkIpPattern(
        ipAddress: string,
        currentUserId: string,
        timeWindowHours: number = 24
    ): Promise<{
        hasSuspiciousPattern: boolean;
        userCount: number;
        userIds: string[];
    }> {
        const since = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

        const fingerprints = await db.deviceFingerprint.findMany({
            where: {
                ipAddress,
                userId: { not: currentUserId },
                updatedAt: { gte: since },
            },
            select: { userId: true },
            distinct: ['userId'],
        });

        return {
            hasSuspiciousPattern: fingerprints.length >= 3, // 3+ users from same IP = suspicious
            userCount: fingerprints.length,
            userIds: fingerprints.map((f) => f.userId),
        };
    }
}

export const deviceFingerprintService = new DeviceFingerprintService();
