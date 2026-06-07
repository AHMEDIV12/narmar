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

    // Get all available achievements
    const achievements = await db.achievement.findMany({
      orderBy: { reward: 'desc' },
    });

    // Get user's earned achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId: payload.userId },
      include: {
        achievement: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    const totalRewards = userAchievements.reduce(
      (sum, ua) => sum + ua.achievement.reward,
      0
    );

    return NextResponse.json({
      achievements,
      userAchievements,
      totalEarned: userAchievements.length,
      totalRewards,
      progress: userAchievements.reduce((acc, ua) => {
        acc[ua.achievementId] = ua.progress;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
