// ==================================
// Base Ad Network Adapter
// ==================================

import {
    IAdNetworkAdapter,
    AdRequest,
    AdResponse,
    FetchAdsOptions,
    NetworkConfig,
    AdCompletionData,
    AdClickData,
    AdConversionData,
} from './types';
import { AdNetworkType } from '@/../generated/prisma';

/**
 * Abstract base class for all ad network adapters
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseAdNetworkAdapter implements IAdNetworkAdapter {
    protected config: NetworkConfig | null = null;
    protected configured: boolean = false;

    abstract readonly networkType: AdNetworkType;
    abstract readonly networkName: string;

    /**
     * Initialize adapter with network-specific configuration
     */
    async initialize(config: NetworkConfig): Promise<void> {
        this.config = config;
        this.configured = await this.validateConfiguration(config);

        if (!this.configured) {
            throw new Error(`${this.networkName} adapter configuration is invalid`);
        }
    }

    /**
     * Check if adapter is properly configured and ready to use
     */
    isConfigured(): boolean {
        return this.configured;
    }

    /**
     * Validate network-specific configuration
     * Override in subclass for custom validation
     */
    protected async validateConfiguration(config: NetworkConfig): Promise<boolean> {
        return !!config && Object.keys(config).length > 0;
    }

    /**
     * Abstract method: Fetch ads from the network
     * Must be implemented by each adapter
     */
    abstract fetchAds(
        request: AdRequest,
        options?: FetchAdsOptions
    ): Promise<AdResponse[]>;

    /**
     * Track ad impression
     * Override in subclass if network requires impression tracking
     */
    async trackImpression(impressionData: AdCompletionData): Promise<void> {
        // Default: no-op
        // Override if network requires server-side impression tracking
    }

    /**
     * Track ad click
     * Override in subclass if network requires click tracking
     */
    async trackClick(clickData: AdClickData): Promise<void> {
        // Default: no-op
        // Override if network requires server-side click tracking
    }

    /**
     * Track conversion (for offerwalls)
     * Override in subclass for networks that support conversions
     */
    async trackConversion(conversionData: AdConversionData): Promise<void> {
        // Default: no-op
        // Override for offerwall networks
    }

    /**
     * Get network health status
     * Override in subclass for network-specific health checks
     */
    async getHealthStatus(): Promise<{
        isHealthy: boolean;
        averageEcpm: number;
        fillRate: number;
        errorRate: number;
    }> {
        return {
            isHealthy: this.configured,
            averageEcpm: 0,
            fillRate: 0,
            errorRate: 0,
        };
    }

    /**
     * Helper: Make HTTP request with error handling
     */
    protected async makeRequest<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText} (${this.networkName})`
                );
            }

            return await response.json();
        } catch (error) {
            console.error(`[${this.networkName}] Request failed:`, error);
            throw error;
        }
    }

    /**
     * Helper: Generate mock ad for development/testing
     * Useful when network doesn't support programmatic access
     */
    protected generateMockAd(
        request: AdRequest,
        networkId: string,
        overrides?: Partial<AdResponse>
    ): AdResponse {
        const baseEarnings = request.subscriptionTier === 'PREMIUM_PLUS' ? 0.5 :
            request.subscriptionTier === 'PREMIUM' ? 0.35 : 0.25;

        return {
            id: `mock-${this.networkType}-${Date.now()}-${Math.random()}`,
            externalId: `ext-${Date.now()}`,
            networkId,
            networkName: this.networkName,
            networkType: this.networkType,
            title: `${this.networkName} Advertisement`,
            description: 'Watch this ad to earn rewards!',
            thumbnailUrl: '/placeholder-ad.jpg',
            contentUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            format: request.format || 'VIDEO',
            durationSeconds: 30,
            earningsPerView: baseEarnings,
            category: 'GENERAL',
            ...overrides,
        };
    }

    /**
     * Helper: Check if user matches targeting criteria
     */
    protected matchesTargeting(request: AdRequest, targeting: any): boolean {
        // Country check
        if (targeting.targetCountries && request.userCountry) {
            const countries = targeting.targetCountries.split(',').map((c: string) => c.trim());
            if (countries.length > 0 && !countries.includes(request.userCountry)) {
                return false;
            }
        }

        // Age check
        if (request.userAge) {
            if (targeting.targetAgeMin && request.userAge < targeting.targetAgeMin) {
                return false;
            }
            if (targeting.targetAgeMax && request.userAge > targeting.targetAgeMax) {
                return false;
            }
        }

        // Gender check
        if (targeting.targetGender && request.userGender) {
            if (targeting.targetGender !== 'ALL' && targeting.targetGender !== request.userGender) {
                return false;
            }
        }

        return true;
    }
}
