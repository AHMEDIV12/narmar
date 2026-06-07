// ==================================
// Ad Network Type Definitions
// ==================================

import { AdFormat, AdNetworkType } from '@/../generated/prisma';

/**
 * User targeting criteria
 */
export interface UserTargeting {
    countries?: string[];
    ageMin?: number;
    ageMax?: number;
    gender?: 'MALE' | 'FEMALE' | 'ALL';
    interests?: string[];
    subscriptionTier?: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
}

/**
 * Ad request from user
 */
export interface AdRequest {
    userId: string;
    userCountry?: string;
    userAge?: number;
    userGender?: string;
    userInterests?: string[];
    subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
    format?: AdFormat;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Ad response returned by network adapters
 */
export interface AdResponse {
    id: string; // Internal ad ID
    externalId?: string; // Network's ad ID
    networkId: string;
    networkName: string;
    networkType: AdNetworkType;
    title: string;
    description?: string;
    thumbnailUrl: string;
    contentUrl: string; // Video URL, iframe URL, click URL, etc.
    format: AdFormat;
    durationSeconds?: number;
    earningsPerView: number;
    category?: string;
    targetingData?: UserTargeting;
    metadata?: Record<string, any>;
}

/**
 * Ad completion data
 */
export interface AdCompletionData {
    adId: string;
    userId: string;
    impressionId?: string;
    campaignId?: string;
    viewDuration?: number; // milliseconds
    completed: boolean;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Click tracking data
 */
export interface AdClickData {
    impressionId: string;
    adId: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Conversion tracking data
 */
export interface AdConversionData {
    clickId: string;
    userId: string;
    conversionType: string;
    revenue: number;
    metadata?: Record<string, any>;
}

/**
 * Ad network configuration interface
 */
export interface NetworkConfig {
    apiKey?: string;
    apiSecret?: string;
    publisherId?: string;
    zoneId?: string;
    siteId?: string;
    appId?: string;
    customerId?: string;
    metadata?: Record<string, any>;
}

/**
 * Ad fetch options
 */
export interface FetchAdsOptions {
    limit?: number;
    format?: AdFormat;
    minEarnings?: number;
    maxEarnings?: number;
}

/**
 * Ad network adapter interface
 * All network-specific adapters must implement this
 */
export interface IAdNetworkAdapter {
    /**
     * Network identifier
     */
    readonly networkType: AdNetworkType;

    /**
     * Network display name
     */
    readonly networkName: string;

    /**
     * Initialize the adapter with configuration
     */
    initialize(config: NetworkConfig): Promise<void>;

    /**
     * Check if adapter is properly configured
     */
    isConfigured(): boolean;

    /**
     * Fetch ads from the network
     */
    fetchAds(request: AdRequest, options?: FetchAdsOptions): Promise<AdResponse[]>;

    /**
     * Track ad impression
     */
    trackImpression(impressionData: AdCompletionData): Promise<void>;

    /**
     * Track ad click
     */
    trackClick(clickData: AdClickData): Promise<void>;

    /**
     * Track conversion (for offerwalls)
     */
    trackConversion(conversionData: AdConversionData): Promise<void>;

    /**
     * Get network health status
     */
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        averageEcpm: number;
        fillRate: number;
        errorRate: number;
    }>;
}

/**
 * Ad rotation weight calculation
 */
export interface AdRotationWeight {
    networkId: string;
    weight: number;
    reason: string;
}

/**
 * Fraud detection result
 */
export interface FraudDetectionResult {
    isFraudulent: boolean;
    confidence: number; // 0-100
    reasons: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    shouldBlock: boolean;
}

/**
 * Device fingerprint data
 */
export interface DeviceFingerprintData {
    userId: string;
    fingerprint: string;
    ipAddress: string;
    userAgent: string;
    screenRes?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    additional?: Record<string, any>;
}

/**
 * Earnings calculation result
 */
export interface EarningsCalculation {
    baseEarnings: number;
    tierMultiplier: number;
    finalEarnings: number;
    installmentAllocation?: number;
    walletCredit: number;
}

/**
 * Ad analytics data
 */
export interface AdAnalytics {
    networkId: string;
    networkName: string;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageEcpm: number;
    clickThroughRate: number;
    conversionRate: number;
    fillRate: number;
}
