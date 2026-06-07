import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { generateResetToken } from '@/lib/utils/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: {
          // In a real app, you'd store this in a separate ResetToken table
          // For simplicity, we'll just return the token
        },
      });

      // TODO: Send email with reset link
      // const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      // await sendResetEmail(user.email, resetUrl);

      console.log(`Reset token for ${email}: ${resetToken}`);
    }

    return NextResponse.json({
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
