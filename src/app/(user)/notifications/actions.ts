"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/database/notification";

const NOTIFICATIONS_PATH = "/notifications";
const DASHBOARD_PATH = "/dashboard";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Mark a single notification as read
 */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  if (!notificationId) {
    return { success: false, error: "Notification ID is required" };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true, isRead: true },
  });

  if (!notification) {
    return { success: false, error: "Notification not found" };
  }

  if (notification.userId !== session.user.id) {
    return {
      success: false,
      error: "Not authorized to access this notification",
    };
  }

  // Already read, no-op success
  if (notification.isRead) {
    return { success: true };
  }

  try {
    await markAsRead(notificationId);
    revalidatePath(NOTIFICATIONS_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch (error) {
    console.error("markNotificationReadAction error:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await markAllAsRead(session.user.id);
    revalidatePath(NOTIFICATIONS_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsReadAction error:", error);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(
  notificationId: string,
): Promise<ActionResult> {
  if (!notificationId) {
    return { success: false, error: "Notification ID is required" };
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  });

  if (!notification) {
    return { success: false, error: "Notification not found" };
  }

  if (notification.userId !== session.user.id) {
    return {
      success: false,
      error: "Not authorized to delete this notification",
    };
  }

  try {
    await deleteNotification(notificationId);
    revalidatePath(NOTIFICATIONS_PATH);
    revalidatePath(DASHBOARD_PATH);
    return { success: true };
  } catch (error) {
    console.error("deleteNotificationAction error:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}
