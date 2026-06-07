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

    const challenge = await db.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (!challenge.isActive) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    const existingParticipation = await db.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: payload.userId,
          challengeId: challenge.id,
        },
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Already joined this challenge' },
        { status: 400 }
      );
    }

    await db.userChallenge.create({
      data: {
        userId: payload.userId,
        challengeId: challenge.id,
      },
    });

    return NextResponse.json({
      message: 'Successfully joined the challenge',
      challenge,
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
