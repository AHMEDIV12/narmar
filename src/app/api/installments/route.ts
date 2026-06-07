import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const installments = await db.installment.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({ installments });
  } catch (error) {
    console.error('Get installments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const {
      title,
      creditorName,
      totalAmount,
      monthlyPayment,
      dueDayOfMonth,
      startDate,
      endDate,
    } = body;

    const installment = await db.installment.create({
      data: {
        userId: payload.userId,
        title,
        creditorName,
        totalAmount: parseFloat(totalAmount),
        remainingAmount: parseFloat(totalAmount),
        monthlyPayment: parseFloat(monthlyPayment),
        dueDayOfMonth: parseInt(dueDayOfMonth),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        nextPaymentDueDate: getNextPaymentDueDate(parseInt(dueDayOfMonth)),
      },
    });

    return NextResponse.json({ installment }, { status: 201 });
  } catch (error) {
    console.error('Create installment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNextPaymentDueDate(dueDay: number): Date {
  const today = new Date();
  const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

  if (dueDate <= today) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  return dueDate;
}
