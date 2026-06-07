import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token) as { userId: string };

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const surveys = await db.survey.findMany({
      where: {
        isActive: true,
        totalResponses: { lt: db.survey.fields.maxResponses }, // Less than max responses
      },
      orderBy: { createdAt: 'desc' },
      include: {
        advertiser: {
          select: {
            companyName: true,
          },
        },
      },
    });

    const completedSurveys = await db.surveyResponse.findMany({
      where: { userId: payload.userId },
      select: { surveyId: true },
    });

    const availableSurveys = surveys
      .filter(survey => !completedSurveys.some(c => c.surveyId === survey.id))
      .slice(0, 20)
      .map(survey => ({
        ...survey,
        provider: survey.createdByAdvertiser && survey.advertiser
          ? survey.advertiser.companyName
          : survey.provider,
      }));

    return NextResponse.json({ surveys: availableSurveys });
  } catch (error) {
    console.error('Get surveys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
