import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { signJWT } from '@/lib/utils/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
      include: { advertiserProfile: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        availableBalance: user.availableBalance,
        totalEarnings: user.totalEarnings || 0,
        todaysEarnings: user.todaysEarnings || 0,
        weeklyEarnings: user.weeklyEarnings || 0,
        monthlyEarnings: user.monthlyEarnings || 0,
        totalWithdrawn: user.totalWithdrawn || 0,
      },
      advertiserProfile: user.role === 'ADVERTISER' && user.advertiserProfile ? {
        id: user.advertiserProfile.id,
        companyName: user.advertiserProfile.companyName,
        companyDescription: user.advertiserProfile.companyDescription,
        website: user.advertiserProfile.website,
        totalEarnings: user.advertiserProfile.totalEarnings,
        totalVideos: user.advertiserProfile.totalVideos,
        totalSurveys: user.advertiserProfile.totalSurveys,
      } : undefined,
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
