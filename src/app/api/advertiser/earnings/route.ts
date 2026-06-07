import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdvertiser } from '@/lib/middleware/advertiser-auth';

export async function GET(req: NextRequest) {
    // Verify advertiser authentication
    const authResult = await verifyAdvertiser(req);
    if (authResult.error) {
        return authResult.error;
    }

    const { advertiserProfile } = authResult;

    try {
        // Get video earnings
        const videos = await db.advertiserVideo.findMany({
            where: { advertiserId: advertiserProfile!.id },
            select: {
                id: true,
                title: true,
                totalViews: true,
                totalEarnings: true,
                earningsPerView: true,
                isActive: true,
            },
        });

        const totalVideoEarnings = videos.reduce((sum, video) => sum + video.totalEarnings, 0);
        const totalVideoViews = videos.reduce((sum, video) => sum + video.totalViews, 0);

        // Get survey earnings
        const surveys = await db.survey.findMany({
            where: { advertiserId: advertiserProfile!.id },
            include: {
                responses: {
                    select: {
                        earnings: true,
                    },
                },
            },
        });

        const totalSurveyEarnings = surveys.reduce((sum, survey) => {
            const surveyEarnings = survey.responses.reduce((s, r) => s + r.earnings, 0);
            return sum + surveyEarnings;
        }, 0);

        const totalSurveyResponses = surveys.reduce((sum, survey) => sum + survey.totalResponses, 0);

        return NextResponse.json({
            overview: {
                totalEarnings: totalVideoEarnings + totalSurveyEarnings,
                totalVideoEarnings,
                totalSurveyEarnings,
                totalVideos: videos.length,
                totalSurveys: surveys.length,
                totalVideoViews,
                totalSurveyResponses,
            },
            videos: videos.map(video => ({
                id: video.id,
                title: video.title,
                views: video.totalViews,
                earnings: video.totalEarnings,
                earningsPerView: video.earningsPerView,
                isActive: video.isActive,
            })),
            surveys: surveys.map(survey => ({
                id: survey.id,
                title: survey.title,
                responses: survey.totalResponses,
                earnings: survey.responses.reduce((s, r) => s + r.earnings, 0),
                earningsPerResponse: survey.earningsAmount,
                isActive: survey.isActive,
            })),
        });
    } catch (error) {
        console.error('Fetch earnings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
