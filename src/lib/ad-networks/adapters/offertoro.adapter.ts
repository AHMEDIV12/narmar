// ==================================
// OfferToro Offerwall Adapter
// ==================================

import { BaseAdNetworkAdapter } from '../base-adapter';
import { AdRequest, AdResponse, FetchAdsOptions, AdConversionData } from '../types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * OfferToro offerwall adapter
 * Offers include surveys, tasks, app downloads, and sign-ups
 */
export class OfferToroAdapter extends BaseAdNetworkAdapter {
    readonly networkType = AdNetworkType.OFFERTORO;
    readonly networkName = 'OfferToro';

    async fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]> {
        if (!this.isConfigured()) {
            throw new Error('OfferToro adapter not configured');
        }

        const limit = options?.limit || 5;
        const ads: AdResponse[] = [];

        // Generate mock offerwall offers
        const offerTypes = [
            { title: '15-Minute Survey', earnings: 1.00, duration: 900 },
            { title: 'Download Gaming App', earnings: 1.75, duration: 300 },
            { title: 'Register on Partner Site', earnings: 0.85, duration: 120 },
            { title: 'Complete Market Research', earnings: 2.20, duration: 1200 },
            { title: 'Try Product Sample', earnings: 3.50, duration: 180 },
            { title: 'Watch Ad Series', earnings: 0.60, duration: 240 },
        ];

        for (let i = 0; i < Math.min(limit, offerTypes.length); i++) {
            const offer = offerTypes[i];
            ads.push(
                this.generateMockAd(request, 'offertoro', {
                    title: offer.title,
                    description: `Earn $${offer.earnings.toFixed(2)} - Estimated ${Math.floor(offer.duration / 60)} minutes`,
                    thumbnailUrl: `https://via.placeholder.com/300x200?text=OfferToro+${i + 1}`,
                    format: 'OFFERWALL',
                    earningsPerView: offer.earnings,
                    durationSeconds: offer.duration,
                    category: 'ENTERTAINMENT',
                })
            );
        }

        return ads;
    }

    async trackConversion(conversionData: AdConversionData): Promise<void> {
        // In a real implementation, this would verify with OfferToro's postback system
        console.log(`[OfferToro] Conversion tracked:`, conversionData);
    }

    protected async validateConfiguration(config: any): Promise<boolean> {
        return !!config?.apiKey && !!config?.appId;
    }
}
