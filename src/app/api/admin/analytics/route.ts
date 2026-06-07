import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

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

    if (!(await isAdmin(payload.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      totalEarnings,
      totalWithdrawals,
      totalAdViews,
      totalSurveyResponses,
      totalTaskAssignments,
      newUsersToday,
      newUsersWeek,
      earningStats,
      withdrawalStats,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          totalEarnings: { gt: 0 },
        },
      }),
      db.user.aggregate({
        _sum: { totalEarnings: true },
      }),
      db.user.aggregate({
        _sum: { totalWithdrawn: true },
      }),
      db.adView.count(),
      db.surveyResponse.count(),
      db.taskAssignment.count(),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.earningActivity.groupBy({
        by: ['activityType'],
        _sum: {
          earningsAmount: true,
        },
        _count: true,
      }),
      db.withdrawalRequest.groupBy({
        by: ['status'],
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    const totalPlatformEarnings = earningStats.reduce((acc, curr) => acc + (curr._sum.earningsAmount || 0), 0);
    const totalPlatformWithdrawals = withdrawalStats.reduce((acc, curr) => acc + (curr._sum.amount || 0), 0);

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalEarnings: totalEarnings._sum.totalEarnings || 0,
        totalWithdrawals: totalWithdrawals._sum.totalWithdrawn || 0,
        totalAdViews,
        totalSurveyResponses,
        totalTaskAssignments,
        newUsersToday,
        newUsersWeek,
      },
      earnings: earningStats,
      withdrawals: withdrawalStats,
      platformRevenue: totalPlatformEarnings - totalPlatformWithdrawals,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
