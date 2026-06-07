import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const makePaymentSchema = z.object({
  amount: z.number().positive(),
  source: z.string(),
  metadata: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, source, metadata } = makePaymentSchema.parse(body);

    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const installment = await db.installment.findUnique({
      where: { id },
    });

    if (!installment || installment.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      );
    }

    if (amount > installment.remainingAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.availableBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      await tx.installmentPayment.create({
        data: {
          installmentId: id,
          amount,
          source,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      const newRemaining = installment.remainingAmount - amount;
      const newTotalPaid = installment.totalPaid + amount;
      const newStatus = newRemaining <= 0 ? 'PAID_OFF' : 'ACTIVE';

      await tx.installment.update({
        where: { id },
        data: {
          remainingAmount: newRemaining,
          totalPaid: newTotalPaid,
          status: newStatus,
          lastPaymentDate: new Date(),
        },
      });

      await tx.transaction.create({
        data: {
          userId: payload.userId,
          type: 'INSTALLMENT_PAYMENT',
          amount: -amount,
          description: `Payment to ${installment.creditorName}: ${installment.title}`,
          status: 'COMPLETED',
          metadata: JSON.stringify({ installmentId: id, installmentTitle: installment.title }),
        },
      });

      await tx.user.update({
        where: { id: payload.userId },
        data: {
          availableBalance: { decrement: amount },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Payment of $${amount.toFixed(2)} successful`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Make payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
