import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const ad = await db.adContent.findUnique({
      where: { id: params.id },
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    if (!ad.isActive || ad.remainingBudget <= 0) {
      return NextResponse.json({ error: 'Ad not available' }, { status: 400 });
    }

    const existingView = await db.adView.findUnique({
      where: {
        adId_userId: {
          adId: ad.id,
          userId: payload.userId,
        },
      },
    });

    if (existingView) {
      return NextResponse.json(
        { error: 'Already watched this ad' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ad: {
        id: ad.id,
        title: ad.title,
        videoUrl: ad.videoUrl,
        duration: ad.durationSeconds,
        earnings: ad.earningsPerView,
      },
      message: 'Ad started. Watch to completion to earn.',
    });
  } catch (error) {
    console.error('Start ad error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
