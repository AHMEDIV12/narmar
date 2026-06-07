// ==================================
// Ad Network Registry
// ==================================

import { IAdNetworkAdapter } from './types';
import { AdNetworkType } from '@/../generated/prisma';
import { GoogleAdSenseAdapter } from './adapters/google-adsense.adapter';
import { PropellerAdsAdapter } from './adapters/propellerads.adapter';
import { AdsterraAdapter } from './adapters/adsterra.adapter';
import { MediaNetAdapter } from './adapters/medianet.adapter';
import { RevContentAdapter } from './adapters/revcontent.adapter';
import { AdGemAdapter } from './adapters/adgem.adapter';
import { OfferToroAdapter } from './adapters/offertoro.adapter';

/**
 * Singleton registry for managing all ad network adapters
 */
export class AdNetworkRegistry {
    private static instance: AdNetworkRegistry;
    private adapters: Map<AdNetworkType, IAdNetworkAdapter>;

    private constructor() {
        this.adapters = new Map();
        this.registerAdapters();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AdNetworkRegistry {
        if (!AdNetworkRegistry.instance) {
            AdNetworkRegistry.instance = new AdNetworkRegistry();
        }
        return AdNetworkRegistry.instance;
    }

    /**
     * Register all ad network adapters
     */
    private registerAdapters(): void {
        this.register(new GoogleAdSenseAdapter());
        this.register(new PropellerAdsAdapter());
        this.register(new AdsterraAdapter());
        this.register(new MediaNetAdapter());
        this.register(new RevContentAdapter());
        this.register(new AdGemAdapter());
        this.register(new OfferToroAdapter());
    }

    /**
     * Register a single adapter
     */
    private register(adapter: IAdNetworkAdapter): void {
        this.adapters.set(adapter.networkType, adapter);
    }

    /**
     * Get adapter by network type
     */
    public getAdapter(networkType: AdNetworkType): IAdNetworkAdapter | undefined {
        return this.adapters.get(networkType);
    }

    /**
     * Get all registered adapters
     */
    public getAllAdapters(): IAdNetworkAdapter[] {
        return Array.from(this.adapters.values());
    }

    /**
     * Get all configured adapters
     */
    public getConfiguredAdapters(): IAdNetworkAdapter[] {
        return this.getAllAdapters().filter((adapter) => adapter.isConfigured());
    }
}

// Export singleton instance
export const adNetworkRegistry = AdNetworkRegistry.getInstance();
