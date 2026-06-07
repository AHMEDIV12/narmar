interface FraudCheckResult {
  isFraudulent: boolean;
  reason?: string;
  confidence: number; // 0-1
}

class FraudDetector {
  private readonly SUSPICIOUS_PATTERNS = {
    rapidActivity: {
      threshold: 10, // 10 activities in 1 minute
      windowMs: 60000,
      weight: 0.8,
    },
    sameIpMultipleAccounts: {
      threshold: 3, // 3 accounts from same IP
      windowMs: 3600000,
      weight: 0.9,
    },
    highDailyEarnings: {
      threshold: 100, // $100 in a day
      weight: 0.7,
    },
    unnaturalPattern: {
      weight: 0.6,
    },
  };

  private userActivityCache: Map<string, Array<{ timestamp: number; type: string }>> = new Map();
  private ipUserCache: Map<string, Set<string>> = new Map();

  async checkRapidActivity(
    userId: string,
    activityType: string
  ): Promise<FraudCheckResult> {
    const now = Date.now();
    const activities = this.userActivityCache.get(userId) || [];

    const recentActivities = activities.filter(
      (a) =>
        a.type === activityType &&
        now - a.timestamp < this.SUSPICIOUS_PATTERNS.rapidActivity.windowMs
    );

    if (recentActivities.length >= this.SUSPICIOUS_PATTERNS.rapidActivity.threshold) {
      return {
        isFraudulent: true,
        reason: 'Rapid activity detected',
        confidence: this.SUSPICIOUS_PATTERNS.rapidActivity.weight,
      };
    }

    return { isFraudulent: false, confidence: 0 };
  }

  async checkMultipleAccountsFromSameIP(
    userId: string,
    ipAddress: string
  ): Promise<FraudCheckResult> {
    const usersFromIp = this.ipUserCache.get(ipAddress) || new Set();

    if (usersFromIp.size >= this.SUSPICIOUS_PATTERNS.sameIpMultipleAccounts.threshold) {
      return {
        isFraudulent: true,
        reason: 'Multiple accounts from same IP',
        confidence: this.SUSPICIOUS_PATTERNS.sameIpMultipleAccounts.weight,
      };
    }

    usersFromIp.add(userId);
    this.ipUserCache.set(ipAddress, usersFromIp);

    return { isFraudulent: false, confidence: 0 };
  }

  async checkHighDailyEarnings(
    dailyEarnings: number
  ): Promise<FraudCheckResult> {
    if (dailyEarnings > this.SUSPICIOUS_PATTERNS.highDailyEarnings.threshold) {
      return {
        isFraudulent: true,
        reason: 'Unusually high daily earnings',
        confidence: this.SUSPICIOUS_PATTERNS.highDailyEarnings.weight,
      };
    }

    return { isFraudulent: false, confidence: 0 };
  }

  recordActivity(userId: string, type: string) {
    const now = Date.now();
    const activities = this.userActivityCache.get(userId) || [];

    activities.push({ timestamp: now, type });

    this.userActivityCache.set(userId, activities);

    setTimeout(() => {
      const oldActivities = this.userActivityCache.get(userId) || [];
      const filtered = oldActivities.filter((a) => now - a.timestamp < 3600000);
      this.userActivityCache.set(userId, filtered);
    }, 3600000);
  }

  async checkFraud(params: {
    userId: string;
    activityType: string;
    ipAddress?: string;
    dailyEarnings?: number;
  }): Promise<FraudCheckResult> {
    const checks: FraudCheckResult[] = [];

    const rapidCheck = await this.checkRapidActivity(params.userId, params.activityType);
    checks.push(rapidCheck);

    if (params.ipAddress) {
      const ipCheck = await this.checkMultipleAccountsFromSameIP(params.userId, params.ipAddress);
      checks.push(ipCheck);
    }

    if (params.dailyEarnings !== undefined) {
      const earningsCheck = await this.checkHighDailyEarnings(params.dailyEarnings);
      checks.push(earningsCheck);
    }

    this.recordActivity(params.userId, params.activityType);

    const fraudulentChecks = checks.filter((c) => c.isFraudulent);

    if (fraudulentChecks.length > 0) {
      const maxConfidence = Math.max(...fraudulentChecks.map((c) => c.confidence));
      const reasons = fraudulentChecks.map((c) => c.reason).filter(Boolean) as string[];

      return {
        isFraudulent: true,
        reason: reasons.join(', '),
        confidence: maxConfidence,
      };
    }

    return { isFraudulent: false, confidence: 0 };
  }
}

export const fraudDetector = new FraudDetector();

export async function checkActivityFraud(params: {
  userId: string;
  activityType: string;
  ipAddress?: string;
  dailyEarnings?: number;
}): Promise<FraudCheckResult> {
  return fraudDetector.checkFraud(params);
}
