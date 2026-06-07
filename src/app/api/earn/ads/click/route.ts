import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';

/**
 * Track ad click
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
        const { impressionId, adId } = body;

        if (!impressionId || !adId) {
            return NextResponse.json(
                { error: 'Impression ID and Ad ID required' },
                { status: 400 }
            );
        }

        // Get client info
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor
            ? forwardedFor.split(',')[0]
            : req.headers.get('x-real-ip') || 'unknown';

        // Create click record
        const click = await db.adClick.create({
            data: {
                impressionId,
                adId,
                userId: payload.userId,
                ipAddress,
                userAgent,
            },
        });

        return NextResponse.json({
            clickId: click.id,
            success: true,
        });
    } catch (error) {
        console.error('Track click error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
