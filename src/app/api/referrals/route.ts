import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        referralCode: true,
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            totalEarnings: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalReferralEarnings = await db.earningActivity.aggregate({
      where: {
        userId: payload.userId,
        activityType: 'REFERRAL',
      },
      _sum: {
        earningsAmount: true,
      },
    });

    const directReferralsCount = user.referrals.length;
    const totalEarningsFromReferrals = totalReferralEarnings._sum.earningsAmount || 0;

    return NextResponse.json({
      referralCode: user.referralCode,
      totalReferrals: directReferralsCount,
      totalEarningsFromReferrals,
      referralLink: `${process.env.APP_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
      referrals: user.referrals,
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
