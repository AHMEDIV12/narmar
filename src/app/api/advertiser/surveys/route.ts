import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';

const createSurveySchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().optional(),
    estimatedMinutes: z.number().int().min(1).max(120),
    earningsAmount: z.number().min(0.01),
    targetDemographics: z.string().optional(),
    questions: z.string().min(10), // JSON string of questions
    maxResponses: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
    // Verify advertiser authentication
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const body = await req.json();
        const validatedData = createSurveySchema.parse(body);

        // Create the survey
        const survey = await db.survey.create({
            data: {
                advertiserId: advertiserProfile!.id,
                title: validatedData.title,
                description: validatedData.description,
                provider: advertiserProfile!.companyName,
                estimatedMinutes: validatedData.estimatedMinutes,
                earningsAmount: validatedData.earningsAmount,
                targetDemographics: validatedData.targetDemographics,
                questions: validatedData.questions,
                maxResponses: validatedData.maxResponses,
                createdByAdvertiser: true,
            },
        });

        // Update advertiser profile survey count
        await db.advertiserProfile.update({
            where: { id: advertiserProfile!.id },
            data: {
                totalSurveys: { increment: 1 },
            },
        });

        return NextResponse.json({
            survey: {
                id: survey.id,
                title: survey.title,
                description: survey.description,
                estimatedMinutes: survey.estimatedMinutes,
                earningsAmount: survey.earningsAmount,
                maxResponses: survey.maxResponses,
                totalResponses: survey.totalResponses,
                isActive: survey.isActive,
                createdAt: survey.createdAt,
            },
        }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            );
        }

        console.error('Survey creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    // Verify advertiser authentication
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        const surveys = await db.survey.findMany({
            where: { advertiserId: advertiserProfile!.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { responses: true },
                },
            },
        });

        return NextResponse.json({
            surveys: surveys.map(survey => ({
                id: survey.id,
                title: survey.title,
                description: survey.description,
                estimatedMinutes: survey.estimatedMinutes,
                earningsAmount: survey.earningsAmount,
                maxResponses: survey.maxResponses,
                totalResponses: survey.totalResponses,
                responseCount: survey._count.responses,
                isActive: survey.isActive,
                createdAt: survey.createdAt,
            })),
        });
    } catch (error) {
        console.error('Fetch surveys error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
