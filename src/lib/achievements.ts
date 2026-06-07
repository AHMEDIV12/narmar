import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number;
  criteria: string;
  check: (userId: string) => Promise<boolean>;
}

class AchievementManager {
  private achievements: Map<string, AchievementDefinition> = new Map();

  async initialize() {
    // Define all achievements
    const achievementDefs: AchievementDefinition[] = [
      {
        id: 'first_ad',
        title: 'First Ad',
        description: 'Watch your first advertisement',
        icon: '🎬',
        reward: 0.50,
        criteria: 'total_ad_views >= 1',
        check: async (userId) => {
          const count = await db.adView.count({ where: { userId } });
          return count >= 1;
        },
      },
      {
        id: 'ad_watcher_10',
        title: 'Ad Enthusiast',
        description: 'Watch 10 advertisements',
        icon: '📺',
        reward: 2.00,
        criteria: 'total_ad_views >= 10',
        check: async (userId) => {
          const count = await db.adView.count({ where: { userId } });
          return count >= 10;
        },
      },
      {
        id: 'ad_watcher_100',
        title: 'Ad Master',
        description: 'Watch 100 advertisements',
        icon: '🏆',
        reward: 10.00,
        criteria: 'total_ad_views >= 100',
        check: async (userId) => {
          const count = await db.adView.count({ where: { userId } });
          return count >= 100;
        },
      },
      {
        id: 'first_survey',
        title: 'First Survey',
        description: 'Complete your first survey',
        icon: '📝',
        reward: 0.50,
        criteria: 'total_surveys >= 1',
        check: async (userId) => {
          const count = await db.surveyResponse.count({ where: { userId } });
          return count >= 1;
        },
      },
      {
        id: 'survey_master_5',
        title: 'Survey Expert',
        description: 'Complete 5 surveys',
        icon: '📊',
        reward: 3.00,
        criteria: 'total_surveys >= 5',
        check: async (userId) => {
          const count = await db.surveyResponse.count({ where: { userId } });
          return count >= 5;
        },
      },
      {
        id: 'first_task',
        title: 'First Task',
        description: 'Complete your first task',
        icon: '✅',
        reward: 0.50,
        criteria: 'total_tasks_completed >= 1',
        check: async (userId) => {
          const count = await db.taskAssignment.count({
            where: { userId, status: 'COMPLETED' },
          });
          return count >= 1;
        },
      },
      {
        id: 'task_master_10',
        title: 'Task Champion',
        description: 'Complete 10 tasks',
        icon: '🎯',
        reward: 5.00,
        criteria: 'total_tasks_completed >= 10',
        check: async (userId) => {
          const count = await db.taskAssignment.count({
            where: { userId, status: 'COMPLETED' },
          });
          return count >= 10;
        },
      },
      {
        id: 'first_earnings_10',
        title: 'Getting Started',
        description: 'Earn your first $10',
        icon: '💰',
        reward: 1.00,
        criteria: 'total_earnings >= 10',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalEarnings: true },
          });
          return (user?.totalEarnings || 0) >= 10;
        },
      },
      {
        id: 'earnings_100',
        title: 'Century Club',
        description: 'Earn $100 total',
        icon: '💎',
        reward: 5.00,
        criteria: 'total_earnings >= 100',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalEarnings: true },
          });
          return (user?.totalEarnings || 0) >= 100;
        },
      },
      {
        id: 'earnings_500',
        title: 'Half Grand',
        description: 'Earn $500 total',
        icon: '🌟',
        reward: 10.00,
        criteria: 'total_earnings >= 500',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalEarnings: true },
          });
          return (user?.totalEarnings || 0) >= 500;
        },
      },
      {
        id: 'earnings_1000',
        title: 'Thousand Dollar Club',
        description: 'Earn $1000 total',
        icon: '🏅',
        reward: 25.00,
        criteria: 'total_earnings >= 1000',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { totalEarnings: true },
          });
          return (user?.totalEarnings || 0) >= 1000;
        },
      },
      {
        id: 'first_referral',
        title: 'First Referral',
        description: 'Refer your first friend',
        icon: '👥',
        reward: 1.00,
        criteria: 'total_referrals >= 1',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            include: {
              _count: {
                select: { referrals: true },
              },
            },
          });
          return (user?._count?.referrals || 0) >= 1;
        },
      },
      {
        id: 'referral_master_10',
        title: 'Network Builder',
        description: 'Refer 10 friends',
        icon: '🌐',
        reward: 10.00,
        criteria: 'total_referrals >= 10',
        check: async (userId) => {
          const user = await db.user.findUnique({
            where: { id: userId },
            include: {
              _count: {
                select: { referrals: true },
              },
            },
          });
          return (user?._count?.referrals || 0) >= 10;
        },
      },
      {
        id: 'week_streak',
        title: 'Week Warrior',
        description: 'Earn for 7 consecutive days',
        icon: '🔥',
        reward: 7.00,
        criteria: 'consecutive_days_earnings >= 7',
        check: async (userId) => {
          const today = new Date();
          let streak = 0;
          
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            
            const dayStart = new Date(checkDate.setHours(0, 0, 0, 0));
            const dayEnd = new Date(checkDate.setHours(23, 59, 59, 999));
            
            const activity = await db.earningActivity.findFirst({
              where: {
                userId,
                createdAt: { gte: dayStart, lte: dayEnd },
                status: 'COMPLETED',
              },
            });
            
            if (activity) {
              streak++;
            } else {
              break;
            }
          }
          
          return streak >= 7;
        },
      },
      {
        id: 'installment_warrior',
        title: 'Installment Warrior',
        description: 'Pay off 3 installments',
        icon: '🏠',
        reward: 5.00,
        criteria: 'installments_paid >= 3',
        check: async (userId) => {
          const installments = await db.installment.findMany({
            where: { userId, status: 'PAID_OFF' },
          });
          return installments.length >= 3;
        },
      },
    ];

    // Initialize achievements in database if they don't exist
    for (const def of achievementDefs) {
      this.achievements.set(def.id, def);

      await db.achievement.upsert({
        where: { id: def.id },
        update: {},
        create: {
          id: def.id,
          title: def.title,
          description: def.description,
          icon: def.icon,
          reward: def.reward,
          criteria: def.criteria,
        },
      });
    }
  }

  async checkAndAwardAchievements(userId: string): Promise<{
    newAchievements: any[];
    totalReward: number;
  }> {
    const newAchievements: any[] = [];
    let totalReward = 0;

    // Get user's current achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });

    const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // Check each achievement
    for (const [id, def] of this.achievements) {
      if (earnedIds.has(id)) continue;

      const isEarned = await def.check(userId);

      if (isEarned) {
        const userAchievement = await db.$transaction(async (tx) => {
          const ua = await tx.userAchievement.create({
            data: {
              userId,
              achievementId: id,
              progress: 100,
            },
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              availableBalance: { increment: def.reward },
              totalEarnings: { increment: def.reward },
            },
          });

          await tx.earningActivity.create({
            data: {
              userId,
              activityType: 'BONUS',
              activityId: id,
              earningsAmount: def.reward,
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          return ua;
        });

        // Create notification
        await createNotification({
          userId,
          type: 'ACHIEVEMENT',
          title: 'Achievement Unlocked!',
          message: `Congratulations! You earned "${def.title}" and received $${def.reward.toFixed(2)}!`,
          metadata: { achievementId: id, reward: def.reward },
        });

        newAchievements.push({
          id: userAchievement.id,
          achievementId: id,
          title: def.title,
          reward: def.reward,
        });

        totalReward += def.reward;
      }
    }

    return {
      newAchievements,
      totalReward,
    };
  }

  async getAchievementProgress(userId: string): Promise<Record<string, number>> {
    const progress: Record<string, number> = {};

    for (const [id, def] of this.achievements) {
      const isEarned = await def.check(userId);
      progress[id] = isEarned ? 100 : 0;
    }

    return progress;
  }
}

export const achievementManager = new AchievementManager();
