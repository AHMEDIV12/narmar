import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';

export async function verifyAdvertiser(req: NextRequest) {
    try {
        const token = req.cookies.get('auth-token')?.value;

        if (!token) {
            return {
                error: NextResponse.json(
                    { error: 'Unauthorized - No token provided' },
                    { status: 401 }
                ),
            };
        }

        const payload = await verifyJWT(token);

        if (!payload || !payload.userId) {
            return {
                error: NextResponse.json(
                    { error: 'Unauthorized - Invalid token' },
                    { status: 401 }
                ),
            };
        }

        const user = await db.user.findUnique({
            where: { id: payload.userId },
            include: { advertiserProfile: true },
        });

        if (!user) {
            return {
                error: NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                ),
            };
        }

        if (user.role !== 'ADVERTISER') {
            return {
                error: NextResponse.json(
                    { error: 'Forbidden - Advertiser access required' },
                    { status: 403 }
                ),
            };
        }

        if (!user.advertiserProfile) {
            return {
                error: NextResponse.json(
                    { error: 'Advertiser profile not found' },
                    { status: 404 }
                ),
            };
        }

        return {
            user,
            advertiserProfile: user.advertiserProfile,
        };
    } catch (error) {
        console.error('Advertiser verification error:', error);
        return {
            error: NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            ),
        };
    }
}
