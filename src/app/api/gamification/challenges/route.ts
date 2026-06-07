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

    const [allChallenges, userChallenges] = await Promise.all([
      db.challenge.findMany({
        where: {
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.userChallenge.findMany({
        where: { userId: payload.userId },
        include: {
          challenge: true,
        },
        orderBy: { joinedAt: 'desc' },
      }),
    ]);

    const joinedIds = new Set(userChallenges.map((uc) => uc.challengeId));

    return NextResponse.json({
      allChallenges,
      userChallenges,
      joinedChallenges: userChallenges,
      availableChallenges: allChallenges.filter((c) => !joinedIds.has(c.id)),
      completedChallenges: userChallenges.filter((uc) => uc.completed),
      totalJoined: userChallenges.length,
      totalCompleted: userChallenges.filter((uc) => uc.completed).length,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
