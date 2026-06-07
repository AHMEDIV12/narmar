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

    const now = new Date();

    // Get active challenges
    const challenges = await db.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' },
    });

    // Get user's participation in challenges
    const userChallenges = await db.userChallenge.findMany({
      where: { userId: payload.userId },
      include: {
        challenge: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    const activeChallenges = challenges.filter(
      c => c.startDate <= now && c.endDate >= now
    );

    return NextResponse.json({
      challenges: activeChallenges,
      userChallenges,
      totalParticipated: userChallenges.length,
      completedChallenges: userChallenges.filter(uc => uc.completed).length,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
