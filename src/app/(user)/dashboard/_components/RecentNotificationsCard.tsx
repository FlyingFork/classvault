"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { BellIcon } from "@radix-ui/react-icons";
import { EmptyState } from "@/app/components/admin";
import { markAllNotificationsRead, markNotificationRead } from "../actions";

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
};

interface RecentNotificationsCardProps {
  notifications: NotificationItem[];
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function RecentNotificationsCard({
  notifications,
}: RecentNotificationsCardProps) {
  const [activeNotificationId, setActiveNotificationId] = useState<
    string | null
  >(null);
  const [isMarkingAll, startMarkAllTransition] = useTransition();
  const [isMarkingOne, startMarkOneTransition] = useTransition();

  const handleMarkAll = () => {
    startMarkAllTransition(async () => {
      const result = await markAllNotificationsRead();
      if (!result.success) {
        toast.error(result.error ?? "Failed to mark notifications as read");
        return;
      }
      toast.success("All notifications marked as read");
    });
  };

  const handleMarkSingle = (notificationId: string) => {
    setActiveNotificationId(notificationId);
    startMarkOneTransition(async () => {
      const result = await markNotificationRead(notificationId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to update notification");
      } else {
        toast.success("Notification marked as read");
      }
      setActiveNotificationId(null);
    });
  };

  return (
    <Card size="2">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="4">Recent Notifications</Heading>
          <Button
            size="1"
            variant="soft"
            onClick={handleMarkAll}
            disabled={isMarkingAll || notifications.length === 0}
          >
            {isMarkingAll ? "Updating..." : "Mark all read"}
          </Button>
        </Flex>

        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellIcon width={28} height={28} />}
            title="No new notifications"
            description="You're all caught up."
          />
        ) : (
          <Flex direction="column" gap="3">
            {notifications.map((notification) => {
              const isPending =
                isMarkingOne && activeNotificationId === notification.id;

              return (
                <Flex
                  key={notification.id}
                  direction="column"
                  gap="2"
                  style={{
                    borderRadius: "var(--radius-3)",
                    backgroundColor: "var(--gray-a2)",
                    padding: "var(--space-3)",
                  }}
                >
                  <Flex justify="between" align="center" gap="3">
                    <Text size="3" weight="medium">
                      {notification.title}
                    </Text>
                    <Text size="1" color="gray">
                      {isPending
                        ? "Updating..."
                        : formatTimeAgo(notification.createdAt)}
                    </Text>
                  </Flex>
                  {notification.description && (
                    <Text size="2" color="gray">
                      {notification.description}
                    </Text>
                  )}
                  {notification.actionUrl && notification.actionLabel && (
                    <Text asChild size="2" color="violet">
                      <Link href={notification.actionUrl}>
                        {notification.actionLabel}
                      </Link>
                    </Text>
                  )}
                  <Flex justify="end">
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => handleMarkSingle(notification.id)}
                      disabled={isPending}
                    >
                      {isPending ? "Marking..." : "Mark read"}
                    </Button>
                  </Flex>
                </Flex>
              );
            })}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
