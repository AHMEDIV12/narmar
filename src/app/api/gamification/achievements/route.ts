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

    const [allAchievements, userAchievements] = await Promise.all([
      db.achievement.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      db.userAchievement.findMany({
        where: { userId: payload.userId },
        include: {
          achievement: true,
        },
        orderBy: { earnedAt: 'desc' },
      }),
    ]);

    const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    return NextResponse.json({
      allAchievements,
      userAchievements,
      earnedAchievements: userAchievements,
      availableAchievements: allAchievements.filter((a) => !earnedIds.has(a.id)),
      totalEarned: userAchievements.length,
      totalAvailable: allAchievements.length,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
