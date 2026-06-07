// ==================================
// Ad Rotation Service
// ==================================

import { db } from '@/lib/db';
import { AdRequest, AdResponse } from './types';
import { adNetworkRegistry } from './ad-network-registry';

/**
 * Smart ad rotation algorithm
 * Selects ads based on eCPM, targeting, and network reliability
 */
export class AdRotationService {
    /**
     * Calculate weight for each network based on multiple factors
     */
    private calculateNetworkWeight(
        networkData: {
            averageEcpm: number;
            fillRate: number;
            reliabilityScore: number;
            priority: number;
            dailyBudget: number | null;
            dailySpent: number;
        },
        userTier: string
    ): number {
        // Base weight from eCPM (normalized to 0-100)
        let weight = networkData.averageEcpm * 10;

        // Factor in fill rate (higher fill rate = more weight)
        weight *= networkData.fillRate / 100;

        // Factor in reliability score (0-100)
        weight *= networkData.reliabilityScore / 100;

        // Priority multiplier (1-10, where 10 is highest priority)
        weight *= networkData.priority / 5;

        // Check daily budget
        if (networkData.dailyBudget) {
            const budgetRemaining = networkData.dailyBudget - networkData.dailySpent;
            if (budgetRemaining <= 0) {
                weight = 0; // No budget left
            } else if (budgetRemaining < networkData.dailyBudget * 0.1) {
                weight *= 0.5; // Low budget = reduce weight
            }
        }

        // Premium users get better ads (higher eCPM networks)
        if (userTier === 'PREMIUM_PLUS') {
            weight *= 1.3;
        } else if (userTier === 'PREMIUM') {
            weight *= 1.15;
        }

        return Math.max(0, weight);
    }

    /**
     * Select networks based on weighted random selection
     */
    private selectNetworksByWeight(
        networks: Array<{ id: string; weight: number }>,
        count: number
    ): string[] {
        const selected: string[] = [];
        const availableNetworks = [...networks].filter((n) => n.weight > 0);

        for (let i = 0; i < count && availableNetworks.length > 0; i++) {
            // Calculate total weight
            const totalWeight = availableNetworks.reduce((sum, n) => sum + n.weight, 0);

            if (totalWeight === 0) break;

            // Random selection based on weight
            let random = Math.random() * totalWeight;
            let selectedIndex = -1;

            for (let j = 0; j < availableNetworks.length; j++) {
                random -= availableNetworks[j].weight;
                if (random <= 0) {
                    selectedIndex = j;
                    break;
                }
            }

            if (selectedIndex >= 0) {
                selected.push(availableNetworks[selectedIndex].id);
                availableNetworks.splice(selectedIndex, 1); // Remove to avoid duplicates
            }
        }

        return selected;
    }

    /**
     * Fetch ads from multiple networks using smart rotation
     */
    async fetchMixedAds(request: AdRequest, totalAdsNeeded: number = 10): Promise<AdResponse[]> {
        try {
            // Get all active networks from database
            const networks = await db.adNetwork.findMany({
                where: { isActive: true },
                include: { config: true },
            });

            if (networks.length === 0) {
                return [];
            }

            // Calculate weights for each network
            const networkWeights = networks.map((network) => ({
                id: network.id,
                type: network.type,
                weight: this.calculateNetworkWeight(
                    {
                        averageEcpm: network.averageEcpm,
                        fillRate: network.fillRate,
                        reliabilityScore: network.reliabilityScore,
                        priority: network.priority,
                        dailyBudget: network.dailyBudget,
                        dailySpent: network.dailySpent,
                    },
                    request.subscriptionTier
                ),
            }));

            // Select networks (could select same network multiple times for higher weight)
            const selectedNetworkIds = this.selectNetworksByWeight(
                networkWeights,
                Math.min(networks.length, 5) // Use up to 5 different networks
            );

            // Fetch ads from selected networks
            const allAds: AdResponse[] = [];

            for (const networkId of selectedNetworkIds) {
                const network = networks.find((n) => n.id === networkId);
                if (!network || !network.config) continue;

                const adapter = adNetworkRegistry.getAdapter(network.type);
                if (!adapter) continue;

                try {
                    // Initialize adapter if not yet initialized
                    if (!adapter.isConfigured() && network.config) {
                        const config = {
                            apiKey: network.config.apiKey || undefined,
                            apiSecret: network.config.apiSecret || undefined,
                            publisherId: network.config.publisherId || undefined,
                            zoneId: network.config.zoneId || undefined,
                            siteId: network.config.siteId || undefined,
                            appId: network.config.appId || undefined,
                            customerId: network.config.customerId || undefined,
                            metadata: network.config.metadata
                                ? JSON.parse(network.config.metadata)
                                : undefined,
                        };
                        await adapter.initialize(config);
                    }

                    // Fetch ads from this network
                    const adsPerNetwork = Math.ceil(totalAdsNeeded / selectedNetworkIds.length);
                    const ads = await adapter.fetchAds(request, { limit: adsPerNetwork });

                    // Add network ID to each ad
                    ads.forEach((ad) => {
                        ad.networkId = networkId;
                    });

                    allAds.push(...ads);
                } catch (error) {
                    console.error(`Error fetching ads from ${network.name}:`, error);
                    // Continue with other networks
                }
            }

            // Shuffle and limit  to requested count
            const shuffled = allAds.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, totalAdsNeeded);
        } catch (error) {
            console.error('Error in ad rotation:', error);
            return [];
        }
    }
}

export const adRotationService = new AdRotationService();
