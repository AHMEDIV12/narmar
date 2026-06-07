import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';
import { createNotification } from '@/lib/notifications';

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

    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    // Check if user is already participating
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
        { error: 'Already participating in this challenge' },
        { status: 400 }
      );
    }

    // Create challenge participation
    const userChallenge = await db.userChallenge.create({
      data: {
        userId: payload.userId,
        challengeId: challenge.id,
        progress: JSON.stringify({
          joinedAt: now,
          current: 0,
          target: challenge.target,
        }),
      },
    });

    // Create notification
    await createNotification({
      userId: payload.userId,
      type: 'ACHIEVEMENT',
      title: 'Challenge Joined!',
      message: `You have joined the "${challenge.title}" challenge. Complete it to earn $${challenge.reward.toFixed(2)}!`,
      metadata: { challengeId: challenge.id, reward: challenge.reward },
    });

    return NextResponse.json({
      message: 'Successfully joined challenge',
      userChallenge,
    }, { status: 201 });
  } catch (error) {
    console.error('Join challenge error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
