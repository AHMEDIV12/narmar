import { db } from '@/lib/db';

interface FraudCheckResult {
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}

class FraudDetector {
  private readonly MAX_AD_VIEWS_PER_HOUR = 30;
  private readonly MAX_SURVEYS_PER_HOUR = 10;
  private readonly MAX_TASKS_PER_HOUR = 15;
  private readonly MAX_DAILY_EARNINGS = 100; // $100 per day threshold
  private readonly MAX_WEEKLY_EARNINGS = 500; // $500 per week threshold
  private readonly FAST_AD_COMPLETION_THRESHOLD = 5; // seconds
  private readonly SIMILAR_IP_THRESHOLD = 5; // same IP for different accounts

  async checkAdViewFraud(userId: string, ipAddress?: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check ad views per hour
    const recentAdViews = await db.adView.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
    });

    if (recentAdViews.length > this.MAX_AD_VIEWS_PER_HOUR) {
      reasons.push(`Excessive ad viewing: ${recentAdViews.length} views in the last hour`);
      riskScore += 30;
    }

    // Check for IP patterns (if IP is provided)
    if (ipAddress) {
      const sameIPViews = await db.adView.findMany({
        where: {
          ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 3600000),
          },
        },
        take: 10,
      });

      const uniqueUsers = new Set(sameIPViews.map(v => v.userId));
      if (uniqueUsers.size > this.SIMILAR_IP_THRESHOLD) {
        reasons.push(`Multiple accounts from same IP address`);
        riskScore += 50;
      }
    }

    // Check for unusually fast completions
    const completedInLast5Min = recentAdViews.filter(
      v => v.createdAt >= new Date(Date.now() - 300000)
    );

    if (completedInLast5Min.length > 10) {
      reasons.push(`Unusually fast ad completion rate`);
      riskScore += 40;
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      reasons,
    };
  }

  async checkSurveyFraud(userId: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    const recentSurveys = await db.surveyResponse.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 3600000),
        },
      },
    });

    if (recentSurveys.length > this.MAX_SURVEYS_PER_HOUR) {
      reasons.push(`Excessive survey completion: ${recentSurveys.length} surveys in the last hour`);
      riskScore += 30;
    }

    // Check for pattern (all surveys completed at almost the same time)
    const surveyTimes = recentSurveys.map(s => s.createdAt.getTime());
    const timeDiffs: number[] = [];
    for (let i = 1; i < surveyTimes.length; i++) {
      timeDiffs.push(surveyTimes[i] - surveyTimes[i - 1]);
    }

    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    if (avgTimeDiff < 10000) { // Less than 10 seconds between surveys
      reasons.push(`Suspiciously fast survey completion pattern`);
      riskScore += 40;
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      reasons,
    };
  }

  async checkTaskFraud(userId: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    const recentTasks = await db.taskAssignment.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 3600000),
        },
      },
    });

    if (recentTasks.length > this.MAX_TASKS_PER_HOUR) {
      reasons.push(`Excessive task submission: ${recentTasks.length} tasks in the last hour`);
      riskScore += 30;
    }

    // Check for low quality submissions (high rejection rate)
    const recentCompletedTasks = await db.taskAssignment.findMany({
      where: {
        userId,
        status: 'REJECTED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 3600000), // Last 7 days
        },
      },
    });

    const totalTasks = await db.taskAssignment.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 3600000),
        },
      },
    });

    if (totalTasks > 0) {
      const rejectionRate = recentCompletedTasks.length / totalTasks;
      if (rejectionRate > 0.5) { // More than 50% rejection rate
        reasons.push(`High task rejection rate: ${(rejectionRate * 100).toFixed(1)}%`);
        riskScore += 25;
      }
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      reasons,
    };
  }

  async checkEarningsFraud(userId: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totalEarnings: true,
        todaysEarnings: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        isSuspicious: true,
        riskScore: 100,
        reasons: ['User not found'],
      };
    }

    // Check daily earnings
    if (user.todaysEarnings > this.MAX_DAILY_EARNINGS) {
      reasons.push(`Unusually high daily earnings: $${user.todaysEarnings.toFixed(2)}`);
      riskScore += 35;
    }

    // Calculate weekly earnings
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600000);
    const weeklyActivities = await db.earningActivity.findMany({
      where: {
        userId,
        createdAt: { gte: weekAgo },
        status: 'COMPLETED',
      },
    });

    const weeklyEarnings = weeklyActivities.reduce(
      (sum, activity) => sum + activity.earningsAmount,
      0
    );

    if (weeklyEarnings > this.MAX_WEEKLY_EARNINGS) {
      reasons.push(`Unusually high weekly earnings: $${weeklyEarnings.toFixed(2)}`);
      riskScore += 40;
    }

    // Check for sudden spike in earnings
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600000);
    const twoWeekActivities = await db.earningActivity.findMany({
      where: {
        userId,
        createdAt: {
          gte: twoWeeksAgo,
          lt: weekAgo,
        },
        status: 'COMPLETED',
      },
    });

    const previousWeekEarnings = twoWeekActivities.reduce(
      (sum, activity) => sum + activity.earningsAmount,
      0
    );

    if (previousWeekEarnings > 0) {
      const growthRate = (weeklyEarnings - previousWeekEarnings) / previousWeekEarnings;
      if (growthRate > 3) { // More than 300% growth
        reasons.push(`Sudden earnings spike: ${(growthRate * 100).toFixed(0)}% weekly growth`);
        riskScore += 30;
      }
    }

    // Check account age vs earnings
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (24 * 3600000);
    if (accountAgeDays < 7 && user.totalEarnings > 50) {
      reasons.push(`New account with unusually high earnings`);
      riskScore += 45;
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      reasons,
    };
  }

  async checkWithdrawalFraud(userId: string, amount: number): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        availableBalance: true,
        totalEarnings: true,
        createdAt: true,
      },
    });

    if (!user) {
      return {
        isSuspicious: true,
        riskScore: 100,
        reasons: ['User not found'],
      };
    }

    // Check if withdrawal is close to full balance
    const withdrawalPercentage = (amount / user.availableBalance) * 100;
    if (withdrawalPercentage > 90) {
      reasons.push(`Withdrawaling ${withdrawalPercentage.toFixed(0)}% of balance`);
      riskScore += 20;
    }

    // Check for multiple recent withdrawals
    const recentWithdrawals = await db.WithdrawalRequest.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 3600000), // Last 7 days
        },
      },
    });

    if (recentWithdrawals.length > 3) {
      reasons.push(`Multiple recent withdrawals: ${recentWithdrawals.length} in 7 days`);
      riskScore += 35;
    }

    // Check for large withdrawal relative to total earnings
    const earningsRatio = amount / user.totalEarnings;
    if (earningsRatio > 0.8) {
      reasons.push(`Large withdrawal relative to total earnings: ${(earningsRatio * 100).toFixed(0)}%`);
      riskScore += 25;
    }

    // Check account age
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (24 * 3600000);
    if (accountAgeDays < 3 && amount > 50) {
      reasons.push(`New account requesting large withdrawal`);
      riskScore += 50;
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      reasons,
    };
  }
}

export const fraudDetector = new FraudDetector();

export type FraudCheckResultType = FraudCheckResult;
