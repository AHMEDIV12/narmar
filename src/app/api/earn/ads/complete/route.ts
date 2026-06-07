import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { earningsCalculatorService } from '@/lib/ad-networks/earnings-calculator.service';
import { fraudDetectorService } from '@/lib/fraud-prevention/fraud-detector.service';

/**
 * Handle ad completion and credit earnings
 */
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);

        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await req.json();
        const { adId, impressionId, viewDuration, source } = body;

        if (!adId || !impressionId) {
            return NextResponse.json({ error: 'Ad ID and Impression ID required' }, { status: 400 });
        }

        // Check if this is an advertiser video or platform ad
        let ad: any = null;
        let isAdvertiserVideo = source === 'advertiser';
        let earningsPerView = 0;
        let durationSeconds = 0;

        if (isAdvertiserVideo) {
            // Get advertiser video details
            const advertiserVideo = await db.advertiserVideo.findUnique({
                where: { id: adId },
            });

            if (!advertiserVideo) {
                return NextResponse.json({ error: 'Video not found' }, { status: 404 });
            }

            ad = advertiserVideo;
            earningsPerView = advertiserVideo.earningsPerView;
            durationSeconds = advertiserVideo.durationSeconds;
        } else {
            // Get platform ad details
            const platformAd = await db.adContent.findUnique({
                where: { id: adId },
                include: { network: true },
            });

            if (!platformAd) {
                return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
            }

            ad = platformAd;
            earningsPerView = platformAd.earningsPerView;
            durationSeconds = platformAd.durationSeconds;
        }

        // Get impression
        const impression = await db.adImpression.findUnique({
            where: { id: impressionId },
        });

        if (!impression) {
            return NextResponse.json({ error: 'Impression not found' }, { status: 404 });
        }

        if (impression.userId !== payload.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (impression.completed) {
            return NextResponse.json({ error: 'Ad already completed' }, { status: 400 });
        }

        // Get client info for fraud detection
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor
            ? forwardedFor.split(',')[0]
            : req.headers.get('x-real-ip') || 'unknown';

        // Fraud detection
        const fraudAnalysis = await fraudDetectorService.analyzeAdCompletion({
            userId: payload.userId,
            adId,
            viewDuration,
            expectedDuration: durationSeconds,
            ipAddress,
            deviceFingerprint: impression.deviceFingerprint || undefined,
        });

        if (fraudAnalysis.shouldBlock) {
            return NextResponse.json(
                {
                    error: 'Ad completion rejected',
                    reasons: fraudAnalysis.reasons,
                },
                { status: 403 }
            );
        }

        // Calculate earnings
        const earningsCalc = await earningsCalculatorService.calculateEarnings(
            payload.userId,
            earningsPerView
        );

        // Update impression
        await db.adImpression.update({
            where: { id: impressionId },
            data: {
                completed: true,
                viewDuration,
                earnings: earningsCalc.finalEarnings,
            },
        });

        // Create earning activity
        const activity = await db.earningActivity.create({
            data: {
                userId: payload.userId,
                activityType: 'AD_WATCH',
                activityId: adId,
                earningsAmount: earningsCalc.finalEarnings,
                status: 'PENDING',
            },
        });

        // Credit earnings
        await earningsCalculatorService.creditEarnings(
            payload.userId,
            earningsCalc,
            activity.id,
            'AD_WATCH'
        );

        // Update ad stats
        if (isAdvertiserVideo) {
            // Update advertiser video stats
            await db.advertiserVideo.update({
                where: { id: adId },
                data: {
                    totalViews: { increment: 1 },
                    totalEarnings: { increment: earningsPerView },
                    remainingBudget: { decrement: earningsPerView },
                },
            });

            // Update advertiser profile earnings
            const video = ad as any;
            await db.advertiserProfile.update({
                where: { id: video.advertiserId },
                data: {
                    totalEarnings: { increment: earningsPerView },
                },
            });
        } else {
            // Update platform ad stats
            await db.adContent.update({
                where: { id: adId },
                data: {
                    totalViews: { increment: 1 },
                    remainingBudget: { decrement: earningsPerView },
                },
            });

            // Update network stats if present
            if ((ad as any).networkId) {
                await db.adNetwork.update({
                    where: { id: (ad as any).networkId },
                    data: {
                        totalRevenue: { increment: earningsPerView },
                        dailySpent: { increment: earningsPerView },
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            earnings: earningsCalc,
            fraudWarning: fraudAnalysis.isFraudulent ? fraudAnalysis.reasons : null,
        });
    } catch (error) {
        console.error('Complete ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
