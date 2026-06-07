import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

export async function PUT(req: NextRequest) {
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
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: {
          userId: payload.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: payload.userId,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or markAllAsRead is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const { notificationIds, deleteAllRead } = body;

    if (deleteAllRead) {
      await db.notification.deleteMany({
        where: {
          userId: payload.userId,
          isRead: true,
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId: payload.userId,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or deleteAllRead is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Notifications deleted' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
