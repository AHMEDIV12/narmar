import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';

const updateVideoSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    totalBudget: z.number().min(0).optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const video = await db.advertiserVideo.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
        });

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ video });
    } catch (error) {
        console.error('Fetch video error:', error);
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
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const body = await req.json();
        const validatedData = updateVideoSchema.parse(body);

        // Verify ownership
        const existingVideo = await db.advertiserVideo.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
        });

        if (!existingVideo) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
        if (validatedData.totalBudget !== undefined) {
            updateData.totalBudget = validatedData.totalBudget;
            // Adjust remaining budget proportionally
            const budgetDiff = validatedData.totalBudget - existingVideo.totalBudget;
            updateData.remainingBudget = existingVideo.remainingBudget + budgetDiff;
        }

        const video = await db.advertiserVideo.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json({ video });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Update video error:', error);
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
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        // Verify ownership
        const video = await db.advertiserVideo.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
        });

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false
        await db.advertiserVideo.update({
            where: { id: params.id },
            data: { isActive: false },
        });

        return NextResponse.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Delete video error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
