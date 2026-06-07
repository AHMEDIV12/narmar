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

    const body = await req.json();
    const { answers } = body;

    if (!answers) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    const survey = await db.survey.findUnique({
      where: { id: params.id },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const existingResponse = await db.surveyResponse.findUnique({
      where: {
        surveyId_userId: {
          surveyId: survey.id,
          userId: payload.userId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Already completed this survey' },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: payload.userId,
          answers: JSON.stringify(answers),
          earnings: survey.earningsAmount,
          completedAt: new Date(),
        },
      }),
      db.survey.update({
        where: { id: survey.id },
        data: {
          totalResponses: { increment: 1 },
        },
      }),
      db.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { increment: survey.earningsAmount },
          totalEarnings: { increment: survey.earningsAmount },
          todaysEarnings: { increment: survey.earningsAmount },
        },
      }),
      db.earningActivity.create({
        data: {
          userId: payload.userId,
          activityType: 'SURVEY',
          activityId: survey.id,
          earningsAmount: survey.earningsAmount,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Survey submitted successfully',
      earnings: survey.earningsAmount,
    });
  } catch (error) {
    console.error('Submit survey error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
