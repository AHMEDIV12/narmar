/**
 * Calculate earnings per view based on video duration
 * Tiered pricing model:
 * - 0-30 seconds: $0.05 per view
 * - 31-60 seconds: $0.10 per view
 * - 61-120 seconds: $0.20 per view
 * - 121+ seconds: $0.30 per view
 */
export function calculateEarningsPerView(durationSeconds: number): number {
    if (durationSeconds <= 30) {
        return 0.05;
    } else if (durationSeconds <= 60) {
        return 0.10;
    } else if (durationSeconds <= 120) {
        return 0.20;
    } else {
        return 0.30;
    }
}

/**
 * Calculate total earnings based on views and duration
 */
export function calculateTotalEarnings(views: number, durationSeconds: number): number {
    const earningsPerView = calculateEarningsPerView(durationSeconds);
    return views * earningsPerView;
}

/**
 * Get earnings tier description for a given duration
 */
export function getEarningsTier(durationSeconds: number): string {
    if (durationSeconds <= 30) {
        return '0-30 seconds';
    } else if (durationSeconds <= 60) {
        return '31-60 seconds';
    } else if (durationSeconds <= 120) {
        return '61-120 seconds';
    } else {
        return '121+ seconds';
    }
}
