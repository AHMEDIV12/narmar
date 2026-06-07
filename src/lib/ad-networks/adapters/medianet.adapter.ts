// ==================================
// Media.net Adapter
// ==================================

import { BaseAdNetworkAdapter } from '../base-adapter';
import { AdRequest, AdResponse, FetchAdsOptions } from '../types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * Media.net adapter
 * Contextual ads from Yahoo Bing Network
 */
export class MediaNetAdapter extends BaseAdNetworkAdapter {
    readonly networkType = AdNetworkType.MEDIANET;
    readonly networkName = 'Media.net';

    async fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]> {
        if (!this.isConfigured()) {
            throw new Error('Media.net adapter not configured');
        }

        const limit = options?.limit || 3;
        const ads: AdResponse[] = [];

        // Generate mock ads with Media.net characteristics
        for (let i = 0; i < limit; i++) {
            ads.push(
                this.generateMockAd(request, 'medianet', {
                    title: `Contextual Ad ${i + 1}`,
                    description: 'Relevant to your interests',
                    thumbnailUrl: `https://via.placeholder.com/300x200?text=Media.net+Ad+${i + 1}`,
                    format: 'NATIVE',
                    earningsPerView: 0.26 + (i * 0.03),
                    category: 'FINANCE',
                })
            );
        }

        return ads;
    }

    protected async validateConfiguration(config: any): Promise<boolean> {
        return !!config?.customerId && !!config?.siteId;
    }
}
