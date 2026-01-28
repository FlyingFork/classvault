import { prisma } from "@/prisma";
import type { Notification } from "@/generated/prisma/client";
import type { PaginationParams } from "./class";

// ============================================================================
// Constants
// ============================================================================

/** Number of days until notifications expire */
export const NOTIFICATION_EXPIRY_DAYS = 30;

// ============================================================================
// Types
// ============================================================================

export type CreateNotificationInput = {
  userId: string;
  title: string;
  description?: string;
  type: string;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
};

// Common includes for notification queries
const notificationIncludes = {
  user: {
    select: { id: true, name: true, email: true },
  },
  uploadRequest: {
    select: { id: true, fileName: true, status: true },
  },
};

// ============================================================================
// Notification Methods
// ============================================================================

/**
 * Create a notification with auto-expiry (30 days by default)
 */
export async function createNotification(
  data: CreateNotificationInput,
): Promise<Notification> {
  const expiresAt =
    data.expiresAt ??
    new Date(Date.now() + NOTIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      type: data.type,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      expiresAt,
    },
    include: notificationIncludes,
  });
}

/**
 * Get a notification by ID
 */
export async function getNotificationById(
  id: string,
): Promise<Notification | null> {
  return prisma.notification.findUnique({
    where: { id },
    include: notificationIncludes,
  });
}

/**
 * Get all non-expired notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  pagination?: PaginationParams,
): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    include: notificationIncludes,
    orderBy: { createdAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get unread, non-expired notifications for a user
 */
export async function getUnreadNotifications(
  userId: string,
  pagination?: PaginationParams,
): Promise<Notification[]> {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
      expiresAt: { gt: new Date() },
    },
    include: notificationIncludes,
    orderBy: { createdAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  return prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    include: notificationIncludes,
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  userId: string,
): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { count: result.count };
}

/**
 * Delete expired notifications (cleanup job)
 */
export async function deleteExpiredNotifications(): Promise<{ count: number }> {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return { count: result.count };
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<Notification> {
  return prisma.notification.delete({
    where: { id },
  });
}

/**
 * Count notifications for a user
 */
export async function countUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      expiresAt: { gt: new Date() },
      ...(unreadOnly ? { isRead: false } : {}),
    },
  });
}
