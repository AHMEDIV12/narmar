import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { ActivityType, ActivityStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const ad = await db.adContent.findUnique({
      where: { id },
    });

    if (!ad || !ad.isActive || ad.remainingBudget <= 0) {
      return NextResponse.json(
        { error: 'Ad not available' },
        { status: 404 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    const earningsMultiplier = user?.subscriptionTier === 'PREMIUM' ? 2 : 
                            user?.subscriptionTier === 'PREMIUM_PLUS' ? 2.5 : 1;
    
    const earningsAmount = ad.earningsPerView * earningsMultiplier;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsTodayCount = await db.adView.count({
      where: {
        adId: id,
        userId: payload.userId,
        createdAt: {
          gte: today,
        },
      },
    });

    if (viewsTodayCount >= ad.dailyViewLimit) {
      return NextResponse.json(
        { error: 'Daily view limit reached for this ad' },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.adView.create({
        data: {
          adId: id,
          userId: payload.userId,
          earnings: earningsAmount,
        },
      });

      await tx.adContent.update({
        where: { id },
        data: {
          remainingBudget: { decrement: earningsAmount },
          totalViews: { increment: 1 },
        },
      });

      await tx.earningActivity.create({
        data: {
          userId: payload.userId,
          activityType: ActivityType.AD_WATCH,
          activityId: id,
          earningsAmount,
          status: ActivityStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: payload.userId,
          type: 'EARNING',
          amount: earningsAmount,
          description: `Watched ad: ${ad.title}`,
          status: 'COMPLETED',
        },
      });

      const todayEarnings = await tx.earningActivity.aggregate({
        where: {
          userId: payload.userId,
          createdAt: { gte: today },
          status: ActivityStatus.COMPLETED,
        },
        _sum: { earningsAmount: true },
      });

      await tx.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { increment: earningsAmount },
          totalEarnings: { increment: earningsAmount },
          todaysEarnings: (todayEarnings._sum.earningsAmount || 0) + earningsAmount,
        },
      });
    });

    return NextResponse.json({
      success: true,
      earnings: earningsAmount,
      message: `You earned $${earningsAmount.toFixed(2)}!`,
    });
  } catch (error) {
    console.error('Complete ad error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
