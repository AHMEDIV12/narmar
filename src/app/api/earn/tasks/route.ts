import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const tasks = await db.task.findMany({
      where: {
        isActive: true,
        currentAssignments: { lt: 1000000 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const assignedTasks = await db.taskAssignment.findMany({
      where: { userId: payload.userId },
      select: { taskId: true },
    });

    const availableTasks = tasks
      .filter(task => !assignedTasks.some(a => a.taskId === task.id))
      .slice(0, 20);

    return NextResponse.json({ tasks: availableTasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
