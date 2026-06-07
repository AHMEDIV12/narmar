// ==================================
// Earnings Calculator Service
// ==================================

import { db } from '@/lib/db';
import { EarningsCalculation } from '../ad-networks/types';
import { SubscriptionTier } from '@/../generated/prisma';

/**
 * Calculate user earnings from ad views with tier multipliers
 * and automatic installment allocation
 */
export class EarningsCalculatorService {
    /**
     * Get earnings multiplier based on subscription tier
     */
    private getTierMultiplier(tier: SubscriptionTier): number {
        switch (tier) {
            case 'PREMIUM_PLUS':
                return 1.5; // 50% bonus
            case 'PREMIUM':
                return 1.25; // 25% bonus
            case 'FREE':
            default:
                return 1.0; // No bonus
        }
    }

    /**
     * Calculate earnings for an ad view
     */
    async calculateEarnings(
        userId: string,
        baseEarnings: number
    ): Promise<EarningsCalculation> {
        // Get user details
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionTier: true,
                installments: {
                    where: {
                        status: 'ACTIVE',
                        automaticPaymentEnabled: true,
                    },
                    orderBy: { nextPaymentDueDate: 'asc' },
                    take: 1,
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Calculate final earnings with tier multiplier
        const tierMultiplier = this.getTierMultiplier(user.subscriptionTier);
        const finalEarnings = baseEarnings * tierMultiplier;

        let installmentAllocation = 0;
        let walletCredit = finalEarnings;

        // Allocate to installment if automatic payment is enabled
        if (user.installments.length > 0) {
            const installment = user.installments[0];
            const remainingAmount = installment.remainingAmount;

            // Allocate 50% of earnings to installment (configurable)
            const allocationPercentage = 0.5;
            installmentAllocation = Math.min(
                finalEarnings * allocationPercentage,
                remainingAmount
            );
            walletCredit = finalEarnings - installmentAllocation;
        }

        return {
            baseEarnings,
            tierMultiplier,
            finalEarnings,
            installmentAllocation,
            walletCredit,
        };
    }

    /**
     * Credit earnings to user's wallet and installment
     */
    async creditEarnings(
        userId: string,
        calculation: EarningsCalculation,
        activityId: string,
        activityType: 'AD_WATCH' | 'SURVEY' | 'TASK' | 'CASHBACK'
    ): Promise<void> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Start transaction
        await db.$transaction(async (tx) => {
            // Update user balances
            await tx.user.update({
                where: { id: userId },
                data: {
                    totalEarnings: { increment: calculation.finalEarnings },
                    availableBalance: { increment: calculation.walletCredit },
                    todaysEarnings: { increment: calculation.finalEarnings },
                    weeklyEarnings: { increment: calculation.finalEarnings },
                    monthlyEarnings: { increment: calculation.finalEarnings },
                },
            });

            // Create transaction record for wallet credit
            await tx.transaction.create({
                data: {
                    userId,
                    type: 'EARNING',
                    amount: calculation.walletCredit,
                    description: `Earnings from ${activityType.toLowerCase().replace('_', ' ')}`,
                    status: 'COMPLETED',
                    metadata: JSON.stringify({
                        activityId,
                        activityType,
                        baseEarnings: calculation.baseEarnings,
                        tierMultiplier: calculation.tierMultiplier,
                    }),
                },
            });

            // If there's installment allocation, process it
            if (calculation.installmentAllocation && calculation.installmentAllocation > 0) {
                const installment = await tx.installment.findFirst({
                    where: {
                        userId,
                        status: 'ACTIVE',
                        automaticPaymentEnabled: true,
                    },
                    orderBy: { nextPaymentDueDate: 'asc' },
                });

                if (installment) {
                    const newRemainingAmount = installment.remainingAmount - calculation.installmentAllocation;
                    const newNextPaymentDate = new Date(installment.nextPaymentDueDate!);

                    // If installment is paid off
                    const isPaidOff = newRemainingAmount <= 0;

                    await tx.installment.update({
                        where: { id: installment.id },
                        data: {
                            remainingAmount: Math.max(0, newRemainingAmount),
                            totalPaid: installment.totalPaid + calculation.installmentAllocation,
                            lastPaymentDate: now,
                            status: isPaidOff ? 'PAID_OFF' : 'ACTIVE',
                        },
                    });

                    // Create installment payment record
                    await tx.installmentPayment.create({
                        data: {
                            installmentId: installment.id,
                            amount: calculation.installmentAllocation,
                            source: `Automatic from ${activityType}`,
                            metadata: JSON.stringify({
                                activityId,
                                activityType,
                            }),
                        },
                    });

                    // Create transaction record for installment payment
                    await tx.transaction.create({
                        data: {
                            userId,
                            type: 'INSTALLMENT_PAYMENT',
                            amount: calculation.installmentAllocation,
                            description: `Auto-payment to ${installment.title}`,
                            status: 'COMPLETED',
                            metadata: JSON.stringify({
                                installmentId: installment.id,
                                activityId,
                                activityType,
                            }),
                        },
                    });
                }
            }

            // Update earning activity status
            await tx.earningActivity.updateMany({
                where: {
                    activityId,
                    userId,
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: now,
                },
            });
        });
    }
}

export const earningsCalculatorService = new EarningsCalculatorService();
