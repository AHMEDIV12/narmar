import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { deviceFingerprintService } from '@/lib/fraud-prevention/device-fingerprint.service';

/**
 * Track ad impression when ad is displayed to user
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
        const { adId, campaignId, screenRes, timezone, language, platform } = body;

        if (!adId) {
            return NextResponse.json({ error: 'Ad ID required' }, { status: 400 });
        }

        // Get client info
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';

        // Generate device fingerprint
        const fingerprint = deviceFingerprintService.generateFingerprint({
            userAgent,
            screenRes,
            timezone,
            language,
            platform,
        });

        // Save device fingerprint
        await deviceFingerprintService.saveFingerprint({
            userId: payload.userId,
            fingerprint,
            ipAddress,
            userAgent,
            screenRes,
            timezone,
            language,
            platform,
        });

        // Create impression record
        const impression = await db.adImpression.create({
            data: {
                adId,
                userId: payload.userId,
                campaignId: campaignId || null,
                deviceFingerprint: fingerprint,
                ipAddress,
                userAgent,
                completed: false,
                earnings: 0,
            },
        });

        return NextResponse.json({
            impressionId: impression.id,
            fingerprint,
        });
    } catch (error) {
        console.error('Track impression error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
