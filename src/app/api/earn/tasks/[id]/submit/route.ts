import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { ActivityType, ActivityStatus } from '@prisma/client';

const submitTaskSchema = z.object({
  submission: z.any(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { submission } = submitTaskSchema.parse(body);

    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const task = await db.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    const assignment = await db.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: id,
          userId: payload.userId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Task not started' },
        { status: 400 }
      );
    }

    if (assignment.status === ActivityStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    const earningsMultiplier = user?.subscriptionTier === 'PREMIUM' ? 2 :
      user?.subscriptionTier === 'PREMIUM_PLUS' ? 2.5 : 1;

    const earningsAmount = task.earningsAmount * earningsMultiplier;

    await db.$transaction(async (tx) => {
      await tx.taskAssignment.update({
        where: { id: assignment.id },
        data: {
          submission: JSON.stringify(submission),
          status: ActivityStatus.UNDER_REVIEW,
          completedAt: new Date(),
          earnings: null, // Will be updated after review
        },
      });

      await tx.earningActivity.create({
        data: {
          userId: payload.userId,
          activityType: ActivityType.TASK,
          activityId: id,
          earningsAmount,
          status: ActivityStatus.UNDER_REVIEW,
          completedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully. Pending review.',
      potentialEarnings: earningsAmount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Submit task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
