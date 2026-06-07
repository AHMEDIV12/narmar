import { db } from '@/lib/db';

export type NotificationType = 
  | 'EARNING'
  | 'PAYMENT'
  | 'WITHDRAWAL'
  | 'TASK'
  | 'SURVEY'
  | 'REFERRAL'
  | 'SYSTEM'
  | 'INSTALLMENT'
  | 'ACHIEVEMENT';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, metadata } = params;

  return await db.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

export async function createEarningNotification(
  userId: string,
  amount: number,
  activityType: string
) {
  return createNotification({
    userId,
    type: 'EARNING',
    title: 'Earnings Added',
    message: `You earned $${amount.toFixed(2)} from ${activityType}.`,
    metadata: { amount, activityType },
  });
}

export async function createWithdrawalNotification(
  userId: string,
  amount: number,
  status: 'pending' | 'approved' | 'rejected' | 'completed'
) {
  const messages: Record<string, string> = {
    pending: `Your withdrawal request for $${amount.toFixed(2)} is being processed.`,
    approved: `Your withdrawal of $${amount.toFixed(2)} has been approved.`,
    rejected: `Your withdrawal request for $${amount.toFixed(2)} was rejected.`,
    completed: `Your withdrawal of $${amount.toFixed(2)} has been completed.`,
  };

  return createNotification({
    userId,
    type: 'WITHDRAWAL',
    title: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: messages[status],
    metadata: { amount, status },
  });
}

export async function createInstallmentPaymentNotification(
  userId: string,
  installmentTitle: string,
  amount: number
) {
  return createNotification({
    userId,
    type: 'INSTALLMENT',
    title: 'Installment Payment',
    message: `$${amount.toFixed(2)} has been automatically applied to your ${installmentTitle}.`,
    metadata: { installmentTitle, amount },
  });
}

export async function createReferralNotification(
  userId: string,
  referralName: string,
  bonusAmount: number
) {
  return createNotification({
    userId,
    type: 'REFERRAL',
    title: 'New Referral!',
    message: `${referralName} signed up using your referral code. You earned $${bonusAmount.toFixed(2)}!`,
    metadata: { referralName, bonusAmount },
  });
}

export async function createAchievementNotification(
  userId: string,
  achievementTitle: string,
  reward: number
) {
  return createNotification({
    userId,
    type: 'ACHIEVEMENT',
    title: 'Achievement Unlocked!',
    message: `Congratulations! You unlocked "${achievementTitle}" and earned $${reward.toFixed(2)}!`,
    metadata: { achievementTitle, reward },
  });
}

export async function createTaskCompletedNotification(
  userId: string,
  taskTitle: string,
  amount: number,
  status: 'completed' | 'under_review' | 'rejected'
) {
  const messages: Record<string, string> = {
    completed: `Your task "${taskTitle}" was completed. You earned $${amount.toFixed(2)}!`,
    under_review: `Your task "${taskTitle}" is under review.`,
    rejected: `Your task "${taskTitle}" was rejected.`,
  };

  return createNotification({
    userId,
    type: 'TASK',
    title: `Task ${status.replace('_', ' ').toUpperCase()}`,
    message: messages[status],
    metadata: { taskTitle, amount, status },
  });
}

export async function createSurveyCompletedNotification(
  userId: string,
  surveyTitle: string,
  amount: number
) {
  return createNotification({
    userId,
    type: 'SURVEY',
    title: 'Survey Completed',
    message: `Great job! You completed "${surveyTitle}" and earned $${amount.toFixed(2)}.`,
    metadata: { surveyTitle, amount },
  });
}

export async function createSystemNotification(
  userIds: string | string[],
  title: string,
  message: string
) {
  const userIdArray = Array.isArray(userIds) ? userIds : [userIds];

  await db.notification.createMany({
    data: userIdArray.map((userId) => ({
      userId,
      type: 'SYSTEM',
      title,
      message,
    })),
  });
}
