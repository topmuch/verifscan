import { db } from "@/lib/db";

export type NotificationType =
  | "recall_alert"
  | "quota_warning"
  | "new_scan"
  | "weekly_report"
  | "payment"
  | "system";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Creates a notification in the database.
 */
export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

/**
 * Returns the unread notifications count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Returns the latest notifications for a user.
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Marks a notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Triggered when a lot is marked as recalled — notifies all fabricants who scan it.
 * In our case, the lot's owner gets the alert.
 */
export async function triggerRecallAlert(lotId: string, reason?: string) {
  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: { product: { select: { userId: true, name: true } } },
  });
  if (!lot) return;

  await createNotification({
    userId: lot.product.userId,
    type: "recall_alert",
    title: "Lot rappelé",
    message: `Le lot ${lot.lotNumber} du produit "${lot.product.name}" a été marqué comme rappelé. ${reason || ""}`.trim(),
    link: `/dashboard/lots`,
    metadata: { lotId, lotNumber: lot.lotNumber, reason },
  });
}

/**
 * Triggered after each QR generation — checks if quota is approaching 80%.
 */
export async function checkQuotaWarning(userId: string) {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.qrCodesLimit === -1) return;

  const percent = Math.round((sub.qrCodesUsed / sub.qrCodesLimit) * 100);
  if (percent >= 80 && percent < 100) {
    // Avoid duplicate warnings (only one per threshold reached)
    const existing = await db.notification.findFirst({
      where: {
        userId,
        type: "quota_warning",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    if (!existing) {
      await createNotification({
        userId,
        type: "quota_warning",
        title: "Quota bientôt atteint",
        message: `Vous avez utilisé ${sub.qrCodesUsed}/${sub.qrCodesLimit} QR codes ce mois-ci (${percent}%). Pensez à upgrader votre plan.`,
        link: `/dashboard/abonnement`,
        metadata: { used: sub.qrCodesUsed, limit: sub.qrCodesLimit, percent },
      });
    }
  }
}
