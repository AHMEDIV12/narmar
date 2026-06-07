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
    const { submission } = body;

    if (!submission) {
      return NextResponse.json({ error: 'Submission is required' }, { status: 400 });
    }

    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const existingAssignment = await db.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: task.id,
          userId: payload.userId,
        },
      },
    });

    if (existingAssignment && existingAssignment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Already completed this task' },
        { status: 400 }
      );
    }

    const taskAssignment = await db.$transaction(async (tx) => {
      const assignment = await tx.taskAssignment.upsert({
        where: {
          taskId_userId: {
            taskId: task.id,
            userId: payload.userId,
          },
        },
        create: {
          taskId: task.id,
          userId: payload.userId,
          submission: JSON.stringify(submission),
          status: 'UNDER_REVIEW',
        },
        update: {
          submission: JSON.stringify(submission),
          status: 'UNDER_REVIEW',
        },
      });

      if (!existingAssignment) {
        await tx.task.update({
          where: { id: task.id },
          data: {
            currentAssignments: { increment: 1 },
          },
        });
      }

      return assignment;
    });

    return NextResponse.json({
      message: 'Task submitted successfully',
      status: 'UNDER_REVIEW',
      assignmentId: taskAssignment.id,
    });
  } catch (error) {
    console.error('Submit task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
