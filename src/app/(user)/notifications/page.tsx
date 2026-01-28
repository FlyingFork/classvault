import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getUserNotifications,
  countUserNotifications,
} from "@/lib/database/notification";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/notifications");
  }

  const [notifications, unreadCount, totalCount] = await Promise.all([
    getUserNotifications(session.user.id, { take: 50 }),
    countUserNotifications(session.user.id, true),
    countUserNotifications(session.user.id, false),
  ]);

  // Serialize data for client component
  const serializedNotifications = notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    description: notification.description,
    type: notification.type as
      | "file_approved"
      | "file_rejected"
      | "file_uploaded",
    actionUrl: notification.actionUrl,
    actionLabel: notification.actionLabel,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() || null,
    createdAt: notification.createdAt.toISOString(),
    expiresAt: notification.expiresAt.toISOString(),
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
  }));

  return (
    <NotificationsClient
      notifications={serializedNotifications}
      unreadCount={unreadCount}
      totalCount={totalCount}
    />
  );
}
