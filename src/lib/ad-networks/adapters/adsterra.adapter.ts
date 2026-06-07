// ==================================
// Adsterra Adapter
// ==================================

import { BaseAdNetworkAdapter } from '../base-adapter';
import { AdRequest, AdResponse, FetchAdsOptions } from '../types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * Adsterra adapter
 * Supports pop-unders, direct links, and native banners
 */
export class AdsterraAdapter extends BaseAdNetworkAdapter {
    readonly networkType = AdNetworkType.ADSTERRA;
    readonly networkName = 'Adsterra';

    async fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]> {
        if (!this.isConfigured()) {
            throw new Error('Adsterra adapter not configured');
        }

        const limit = options?.limit || 3;
        const ads: AdResponse[] = [];

        // Generate mock ads with Adsterra characteristics
        for (let i = 0; i < limit; i++) {
            ads.push(
                this.generateMockAd(request, 'adsterra', {
                    title: `Adsterra Ad ${i + 1}`,
                    description: 'High-paying advertisement',
                    thumbnailUrl: `https://via.placeholder.com/300x200?text=Adsterra+Ad+${i + 1}`,
                    format: 'DISPLAY',
                    earningsPerView: 0.32 + (i * 0.06),
                    category: 'GAMING',
                })
            );
        }

        return ads;
    }

    protected async validateConfiguration(config: any): Promise<boolean> {
        return !!config?.publisherId && !!config?.apiSecret;
    }
}
