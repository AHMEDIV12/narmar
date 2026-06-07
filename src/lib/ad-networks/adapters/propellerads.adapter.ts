// ==================================
// PropellerAds Adapter
// ==================================

import { BaseAdNetworkAdapter } from '../base-adapter';
import { AdRequest, AdResponse, FetchAdsOptions } from '../types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * PropellerAds adapter
 * Supports push notifications, native ads, and interstitials
 */
export class PropellerAdsAdapter extends BaseAdNetworkAdapter {
    readonly networkType = AdNetworkType.PROPELLERADS;
    readonly networkName = 'PropellerAds';

    async fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]> {
        if (!this.isConfigured()) {
            throw new Error('PropellerAds adapter not configured');
        }

        const limit = options?.limit || 3;
        const ads: AdResponse[] = [];

        // Generate mock ads with PropellerAds characteristics
        for (let i = 0; i < limit; i++) {
            const formats = ['DISPLAY', 'INTERSTITIAL', 'NATIVE'];
            const format = formats[i % formats.length];

            ads.push(
                this.generateMockAd(request, 'propellerads', {
                    title: `${format} Ad ${i + 1}`,
                    description: 'Click to discover more',
                    thumbnailUrl: `https://via.placeholder.com/300x200?text=PropellerAds+${format}`,
                    format: format as any,
                    earningsPerView: 0.28 + (i * 0.04),
                    category: 'ENTERTAINMENT',
                })
            );
        }

        return ads;
    }

    protected async validateConfiguration(config: any): Promise<boolean> {
        return !!config?.apiKey && !!config?.zoneId;
    }
}
