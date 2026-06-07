import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { ActivityStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!task || !task.isActive) {
      return NextResponse.json(
        { error: 'Task not available' },
        { status: 404 }
      );
    }

    if (task.currentAssignments >= task.maxAssignments) {
      return NextResponse.json(
        { error: 'Task has reached maximum assignments' },
        { status: 400 }
      );
    }

    const existingAssignment = await db.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: id,
          userId: payload.userId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Task already started' },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.taskAssignment.create({
        data: {
          taskId: id,
          userId: payload.userId,
          status: ActivityStatus.PENDING,
        },
      });

      await tx.task.update({
        where: { id },
        data: {
          currentAssignments: { increment: 1 },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Task started successfully',
    });
  } catch (error) {
    console.error('Start task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
