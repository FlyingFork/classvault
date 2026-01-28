"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Tabs,
  IconButton,
  Box,
} from "@radix-ui/themes";
import {
  BellIcon,
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageLayout, EmptyState } from "@/app/components/admin";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "./actions";

interface NotificationData {
  id: string;
  title: string;
  description: string | null;
  type: "file_approved" | "file_rejected" | "file_uploaded";
  actionUrl: string | null;
  actionLabel: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  expiresAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

interface NotificationsClientProps {
  notifications: NotificationData[];
  unreadCount: number;
  totalCount: number;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "file_approved":
      return (
        <CheckCircledIcon width={20} height={20} color="var(--green-11)" />
      );
    case "file_rejected":
      return <CrossCircledIcon width={20} height={20} color="var(--red-11)" />;
    default:
      return <BellIcon width={20} height={20} color="var(--violet-11)" />;
  }
}

function getNotificationColor(type: string): "green" | "red" | "violet" {
  switch (type) {
    case "file_approved":
      return "green";
    case "file_rejected":
      return "red";
    default:
      return "violet";
  }
}

interface NotificationCardProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  isPending,
}: NotificationCardProps) {
  const router = useRouter();
  const color = getNotificationColor(notification.type);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <Card
      size="2"
      style={{
        cursor: notification.actionUrl ? "pointer" : "default",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.15s ease",
      }}
      onClick={handleClick}
    >
      <Flex gap="3" align="start">
        {/* Unread Indicator + Icon */}
        <Flex align="center" gap="2" style={{ paddingTop: 2 }}>
          {!notification.isRead && (
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: `var(--${color}-9)`,
                flexShrink: 0,
              }}
              aria-label="Unread notification"
            />
          )}
          {notification.isRead && <Box style={{ width: 8 }} />}
          <Flex
            align="center"
            justify="center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-2)",
              backgroundColor: `var(--${color}-a3)`,
              flexShrink: 0,
            }}
          >
            {getNotificationIcon(notification.type)}
          </Flex>
        </Flex>

        {/* Content */}
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          <Flex justify="between" align="start" gap="2">
            <Text
              size="2"
              weight={notification.isRead ? "regular" : "medium"}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {notification.title}
            </Text>
            <Flex gap="2" align="center" style={{ flexShrink: 0 }}>
              <Text size="1" color="gray">
                {formatRelativeTime(notification.createdAt)}
              </Text>
              <IconButton
                size="1"
                variant="ghost"
                color="gray"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Delete notification"
              >
                <Cross2Icon />
              </IconButton>
            </Flex>
          </Flex>

          {notification.description && (
            <Text size="2" color="gray" style={{ wordBreak: "break-word" }}>
              {notification.description}
            </Text>
          )}

          {notification.actionUrl && notification.actionLabel && (
            <Flex mt="2">
              <Button
                size="1"
                variant="soft"
                color={color}
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={notification.actionUrl}>
                  {notification.actionLabel}
                  <ArrowRightIcon />
                </Link>
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}

export function NotificationsClient({
  notifications,
  unreadCount,
}: NotificationsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => !deletedIds.has(n.id))
      .filter((n) => {
        if (filter === "unread") {
          return !n.isRead && !readIds.has(n.id);
        }
        return true;
      });
  }, [notifications, filter, deletedIds, readIds]);

  const displayUnreadCount = useMemo(() => {
    const markedReadCount = notifications.filter(
      (n) => !n.isRead && readIds.has(n.id),
    ).length;
    return Math.max(0, unreadCount - markedReadCount);
  }, [notifications, unreadCount, readIds]);

  const handleMarkRead = (id: string) => {
    // Optimistic update
    setReadIds((prev) => new Set(prev).add(id));

    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (!result.success) {
        // Revert on failure
        setReadIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.error(result.error || "Failed to mark as read");
      }
    });
  };

  const handleMarkAllRead = () => {
    // Optimistic update
    const unreadNotifIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    setReadIds((prev) => new Set([...prev, ...unreadNotifIds]));

    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success) {
        toast.success("All notifications marked as read");
        router.refresh();
      } else {
        // Revert on failure
        setReadIds(new Set());
        toast.error(result.error || "Failed to mark all as read");
      }
    });
  };

  const handleDelete = (id: string) => {
    // Optimistic update
    setDeletedIds((prev) => new Set(prev).add(id));

    startTransition(async () => {
      const result = await deleteNotificationAction(id);
      if (result.success) {
        router.refresh();
      } else {
        // Revert on failure
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.error(result.error || "Failed to delete notification");
      }
    });
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/notifications", name: "Notifications" },
      ]}
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Heading size="6">Notifications</Heading>
        {displayUnreadCount > 0 && (
          <Button
            variant="soft"
            size="2"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckIcon />
            Mark All Read
          </Button>
        )}
      </Flex>

      <Tabs.Root value={filter} onValueChange={setFilter}>
        <Tabs.List>
          <Tabs.Trigger value="all">
            All ({notifications.length - deletedIds.size})
          </Tabs.Trigger>
          <Tabs.Trigger value="unread">
            Unread ({displayUnreadCount})
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon width={32} height={32} />}
          title={
            filter === "unread" ? "No unread notifications" : "No notifications"
          }
          description={
            filter === "unread"
              ? "You're all caught up!"
              : "Notifications about your file requests will appear here"
          }
        />
      ) : (
        <Flex direction="column" gap="3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={{
                ...notification,
                isRead: notification.isRead || readIds.has(notification.id),
              }}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </Flex>
      )}
    </AdminPageLayout>
  );
}
