import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/utils/auth';
import { z } from 'zod';

const withdrawalSchema = z.object({
  amount: z.number().min(10),
  paymentMethod: z.enum(['PAYPAL', 'BANK_TRANSFER', 'CRYPTO', 'CHECK']),
  paymentDetails: z.string().min(10),
});

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
    const { amount, paymentMethod, paymentDetails } = withdrawalSchema.parse(body);

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.withdrawalRequest.create({
        data: {
          userId: payload.userId,
          amount: parseFloat(amount.toString()),
          paymentMethod,
          paymentDetails: JSON.stringify(paymentDetails),
        },
      }),
      db.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
        },
      }),
      db.transaction.create({
        data: {
          userId: payload.userId,
          type: 'WITHDRAWAL',
          amount: -amount,
          description: `Withdrawal via ${paymentMethod}`,
          status: 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
