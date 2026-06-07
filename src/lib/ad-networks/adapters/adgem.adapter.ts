// ==================================
// AdGem Offerwall Adapter
// ==================================

import { BaseAdNetworkAdapter } from '../base-adapter';
import { AdRequest, AdResponse, FetchAdsOptions, AdConversionData } from '../types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * AdGem offerwall adapter
 * Gamified earning activities (surveys, app installs, trials)
 */
export class AdGemAdapter extends BaseAdNetworkAdapter {
    readonly networkType = AdNetworkType.ADGEM;
    readonly networkName = 'AdGem';

    async fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]> {
        if (!this.isConfigured()) {
            throw new Error('AdGem adapter not configured');
        }

        const limit = options?.limit || 5;
        const ads: AdResponse[] = [];

        // Generate mock offerwall offers
        const offerTypes = [
            { title: 'Complete Survey - 5 min', earnings: 0.75, duration: 300 },
            { title: 'Install App & Reach Level 10', earnings: 2.50, duration: 600 },
            { title: 'Sign up for Free Trial', earnings: 1.25, duration: 180 },
            { title: 'Watch Short Video Playlist', earnings: 0.50, duration: 120 },
            { title: 'Complete Profile Quiz', earnings: 0.40, duration: 90 },
        ];

        for (let i = 0; i < Math.min(limit, offerTypes.length); i++) {
            const offer = offerTypes[i];
            ads.push(
                this.generateMockAd(request, 'adgem', {
                    title: offer.title,
                    description: `Earn $${offer.earnings.toFixed(2)} by completing this offer`,
                    thumbnailUrl: `https://via.placeholder.com/300x200?text=AdGem+Offer+${i + 1}`,
                    format: 'OFFERWALL',
                    earningsPerView: offer.earnings,
                    durationSeconds: offer.duration,
                    category: 'GAMING',
                })
            );
        }

        return ads;
    }

    async trackConversion(conversionData: AdConversionData): Promise<void> {
        // In a real implementation, this would verify with AdGem's postback system
        console.log(`[AdGem] Conversion tracked:`, conversionData);
    }

    protected async validateConfiguration(config: any): Promise<boolean> {
        return !!config?.apiKey && !!config?.appId;
    }
}
