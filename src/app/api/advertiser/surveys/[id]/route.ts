import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';

const updateSurveySchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    maxResponses: z.number().int().min(1).optional(),
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
        const survey = await db.survey.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
            include: {
                _count: {
                    select: { responses: true },
                },
            },
        });

        if (!survey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ survey });
    } catch (error) {
        console.error('Fetch survey error:', error);
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
        const validatedData = updateSurveySchema.parse(body);

        // Verify ownership
        const existingSurvey = await db.survey.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
        });

        if (!existingSurvey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
        if (validatedData.maxResponses !== undefined) updateData.maxResponses = validatedData.maxResponses;

        const survey = await db.survey.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json({ survey });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Update survey error:', error);
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
        const survey = await db.survey.findFirst({
            where: {
                id: params.id,
                advertiserId: advertiserProfile!.id,
            },
        });

        if (!survey) {
            return NextResponse.json(
                { error: 'Survey not found' },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false
        await db.survey.update({
            where: { id: params.id },
            data: { isActive: false },
        });

        return NextResponse.json({ message: 'Survey deleted successfully' });
    } catch (error) {
        console.error('Delete survey error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
