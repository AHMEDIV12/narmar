import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ActivityType, ActivityStatus } from '@prisma/client';

const submitSurveySchema = z.object({
  answers: z.any(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { answers } = submitSurveySchema.parse(body);

    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const survey = await db.survey.findUnique({
      where: { id },
    });

    if (!survey || !survey.isActive) {
      return NextResponse.json(
        { error: 'Survey not available' },
        { status: 404 }
      );
    }

    if (survey.totalResponses >= survey.maxResponses) {
      return NextResponse.json(
        { error: 'Survey has reached maximum responses' },
        { status: 400 }
      );
    }

    const existingResponse = await db.surveyResponse.findUnique({
      where: {
        surveyId_userId: {
          surveyId: id,
          userId: payload.userId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Survey already completed' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    const earningsMultiplier = user?.subscriptionTier === 'PREMIUM' ? 2 :
      user?.subscriptionTier === 'PREMIUM_PLUS' ? 2.5 : 1;

    const earningsAmount = survey.earningsAmount * earningsMultiplier;

    await db.$transaction(async (tx) => {
      await tx.surveyResponse.create({
        data: {
          surveyId: id,
          userId: payload.userId,
          answers: JSON.stringify(answers),
          earnings: earningsAmount,
          disqualified: false,
        },
      });

      await tx.survey.update({
        where: { id },
        data: {
          totalResponses: { increment: 1 },
        },
      });

      await tx.earningActivity.create({
        data: {
          userId: payload.userId,
          activityType: ActivityType.SURVEY,
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
          description: `Completed survey: ${survey.title}`,
          status: 'COMPLETED',
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await tx.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { increment: earningsAmount },
          totalEarnings: { increment: earningsAmount },
          todaysEarnings: { increment: earningsAmount },
        },
      });
    });

    return NextResponse.json({
      success: true,
      earnings: earningsAmount,
      message: `You earned $${earningsAmount.toFixed(2)}!`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Submit survey error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
