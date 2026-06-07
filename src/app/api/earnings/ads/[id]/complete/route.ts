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

    await db.$transaction([
      db.adView.create({
        data: {
          adId: ad.id,
          userId: payload.userId,
          completedAt: new Date(),
          earnings: ad.earningsPerView,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      }),
      db.adContent.update({
        where: { id: ad.id },
        data: {
          remainingBudget: { decrement: ad.earningsPerView },
          totalViews: { increment: 1 },
        },
      }),
      db.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { increment: ad.earningsPerView },
          totalEarnings: { increment: ad.earningsPerView },
          todaysEarnings: { increment: ad.earningsPerView },
        },
      }),
      db.earningActivity.create({
        data: {
          userId: payload.userId,
          activityType: 'AD_WATCH',
          activityId: ad.id,
          earningsAmount: ad.earningsPerView,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Ad completed successfully',
      earnings: ad.earningsPerView,
    });
  } catch (error) {
    console.error('Complete ad error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
