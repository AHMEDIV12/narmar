import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';

export async function GET(req: NextRequest) {
    // Verify advertiser authentication
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const videos = await db.advertiserVideo.findMany({
            where: { advertiserId: advertiserProfile!.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ videos });
    } catch (error) {
        console.error('Fetch videos error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
