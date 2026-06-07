import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { generateReferralCode, signJWT } from '@/lib/utils/auth';

const registerAdvertiserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    companyName: z.string().min(2),
    companyDescription: z.string().optional(),
    website: z.string().url().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    paymentEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validatedData = registerAdvertiserSchema.parse(body);

        // Check if email already exists
        const existingUser = await db.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        const passwordHash = await hash(validatedData.password, 12);

        // Create user with advertiser role and advertiser profile in a transaction
        const result = await db.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: validatedData.email,
                    passwordHash,
                    name: validatedData.name,
                    referralCode: generateReferralCode(),
                    role: 'ADVERTISER',
                },
            });

            const advertiserProfile = await tx.advertiserProfile.create({
                data: {
                    userId: user.id,
                    companyName: validatedData.companyName,
                    companyDescription: validatedData.companyDescription,
                    website: validatedData.website,
                    contactEmail: validatedData.contactEmail || validatedData.email,
                    contactPhone: validatedData.contactPhone,
                    paymentEmail: validatedData.paymentEmail || validatedData.email,
                },
            });

            return { user, advertiserProfile };
        });

        const token = await signJWT({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role,
        });

        const response = NextResponse.json(
            {
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    name: result.user.name,
                    role: result.user.role,
                },
                advertiserProfile: {
                    id: result.advertiserProfile.id,
                    companyName: result.advertiserProfile.companyName,
                    companyDescription: result.advertiserProfile.companyDescription,
                    website: result.advertiserProfile.website,
                    totalEarnings: result.advertiserProfile.totalEarnings,
                    totalVideos: result.advertiserProfile.totalVideos,
                    totalSurveys: result.advertiserProfile.totalSurveys,
                },
                token,
            },
            { status: 201 }
        );

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

        console.error('Advertiser registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
