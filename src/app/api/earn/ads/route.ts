import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { adRotationService } from '@/lib/ad-networks/ad-rotation.service';
import { fraudDetectorService } from '@/lib/fraud-prevention/fraud-detector.service';
import { deviceFingerprintService } from '@/lib/fraud-prevention/device-fingerprint.service';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        country: true,
        dateOfBirth: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is blocked due to fraud
    const isBlocked = await fraudDetectorService.isUserBlocked(user.id);
    if (isBlocked) {
      return NextResponse.json(
        { error: 'Account temporarily restricted due to suspicious activity' },
        { status: 403 }
      );
    }

    // Get client info for fingerprinting
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';

    // Calculate age from date of birth
    let userAge: number | undefined;
    if (user.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(user.dateOfBirth);
      userAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        userAge--;
      }
    }

    // Fetch ads from multiple networks using smart rotation
    let ads = await adRotationService.fetchMixedAds(
      {
        userId: user.id,
        userCountry: user.country || undefined,
        userAge,
        subscriptionTier: user.subscriptionTier,
        ipAddress,
        userAgent,
      },
      10 // Fetch 10 ads
    );

    // If no ads from external networks, fetch from static adContent and advertiser videos
    if (ads.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch platform ads
      const staticAds = await db.adContent.findMany({
        where: {
          isActive: true,
          remainingBudget: { gt: 0 },
        },
        include: {
          network: true,
        },
        take: 10,
      });

      // Fetch advertiser videos
      const advertiserVideos = await db.advertiserVideo.findMany({
        where: {
          isActive: true,
          remainingBudget: { gt: 0 },
        },
        take: 10,
      });

      // Filter ads by target countries (if applicable)
      const countryFilteredAds = staticAds.filter((ad) => {
        if (!ad.targetCountries || ad.targetCountries === '') {
          return true; // Available to all countries
        }
        if (!user.country) {
          return true; // User has no country set, show all ads
        }
        return ad.targetCountries.includes(user.country);
      });

      // Filter advertiser videos by target countries
      const countryFilteredVideos = advertiserVideos.filter((video) => {
        if (!video.targetCountries || video.targetCountries === '') {
          return true; // Available to all countries
        }
        if (!user.country) {
          return true; // User has no country set, show all videos
        }
        return video.targetCountries.includes(user.country);
      });

      // Filter out ads that have reached daily view limit for this user
      const adsWithViewCounts = await Promise.all(
        countryFilteredAds.map(async (ad) => {
          const viewCount = await db.adView.count({
            where: {
              adId: ad.id,
              userId: user.id,
              createdAt: { gte: today },
            },
          });
          return { ad, viewCount };
        })
      );

      const availableAds = adsWithViewCounts
        .filter(({ ad, viewCount }) => viewCount < ad.dailyViewLimit)
        .map(({ ad }) => ({
          id: ad.id,
          networkId: ad.networkId || ad.network?.id || '',
          networkName: ad.network?.name || 'Internal',
          networkType: ad.network?.type || 'GOOGLE_ADSENSE', // Default network type
          title: ad.title,
          description: ad.description || undefined,
          thumbnailUrl: ad.thumbnailUrl,
          contentUrl: ad.videoUrl, // Map videoUrl to contentUrl for frontend compatibility
          format: ad.adFormat, // Map adFormat to format
          durationSeconds: ad.durationSeconds || undefined,
          earningsPerView: ad.earningsPerView,
          category: ad.category || undefined,
          source: 'platform' as const,
        }));

      // Map advertiser videos to ad format
      const advertiserAds = countryFilteredVideos.map((video) => ({
        id: video.id,
        networkId: 'advertiser',
        networkName: 'Advertiser',
        networkType: 'GOOGLE_ADSENSE' as const,
        title: video.title,
        description: video.description || undefined,
        thumbnailUrl: video.thumbnailUrl,
        contentUrl: video.videoUrl,
        format: 'VIDEO' as const,
        durationSeconds: video.durationSeconds,
        earningsPerView: video.earningsPerView,
        category: video.category || undefined,
        source: 'advertiser' as const,
        advertiserId: video.advertiserId,
      }));

      // Combine and shuffle ads
      ads = [...availableAds, ...advertiserAds].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({ ads });
  } catch (error) {
    console.error('Get ads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
