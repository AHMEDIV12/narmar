import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

export async function GET(
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

    const installment = await db.installment.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!installment) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    return NextResponse.json({ installment });
  } catch (error) {
    console.error('Get installment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { automaticPaymentEnabled } = body;

    const installment = await db.installment.updateMany({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      data: {
        automaticPaymentEnabled,
      },
    });

    if (installment.count === 0) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Installment updated successfully' });
  } catch (error) {
    console.error('Update installment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const installment = await db.installment.deleteMany({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (installment.count === 0) {
      return NextResponse.json({ error: 'Installment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Installment deleted successfully' });
  } catch (error) {
    console.error('Delete installment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
