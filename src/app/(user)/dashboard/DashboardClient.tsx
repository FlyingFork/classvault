"use client";

import { useState } from "react";
import { Flex, Grid, Heading, Text } from "@radix-ui/themes";
import {
  BellIcon,
  ClockIcon,
  EyeOpenIcon,
  FileTextIcon,
  LockClosedIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { QuickActionCard, StatCard } from "@/app/components/admin";
import type { ActiveClassOption } from "@/lib/database/dashboard";
import { RecentRequestsCard } from "./_components/RecentRequestsCard";
import { RecentNotificationsCard } from "./_components/RecentNotificationsCard";
import { UploadRequestDialog } from "./_components/UploadRequestDialog";

type DashboardStats = {
  filesCount: number;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
  fileAccessCount: number;
};

type RecentRequest = {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  respondedAt: string | null;
  rejectionReason: string | null;
  className: string;
  respondedByName: string | null;
  fileId?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
};

type DashboardData = {
  stats: DashboardStats;
  recentRequests: RecentRequest[];
  recentNotifications: NotificationItem[];
};

type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
};

interface DashboardClientProps {
  userData: UserData;
  dashboardData: DashboardData;
  activeClasses: ActiveClassOption[];
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function DashboardClient({
  userData,
  dashboardData,
  activeClasses,
}: DashboardClientProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const userDisplayName = userData.name || userData.email || "there";
  const isAdmin = userData.role === "admin";

  const { stats, recentRequests, recentNotifications } = dashboardData;

  return (
    <>
      <Flex direction="column" gap="6" p={{ initial: "4", md: "6" }}>
        <Flex direction="column" gap="2">
          <Heading size="8">Dashboard</Heading>
          <Text size="3" color="gray">
            Welcome back, {userDisplayName}
          </Text>
        </Flex>

        <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="4">
          <StatCard
            icon={<FileTextIcon width={20} height={20} />}
            label="My Files"
            value={formatNumber(stats.filesCount)}
            color="blue"
          />
          <StatCard
            icon={<ClockIcon width={20} height={20} />}
            label="Pending Requests"
            value={formatNumber(stats.pendingRequestsCount)}
            color={stats.pendingRequestsCount > 0 ? "orange" : "gray"}
          />
          <StatCard
            icon={<BellIcon width={20} height={20} />}
            label="Unread Notifications"
            value={formatNumber(stats.unreadNotificationsCount)}
            color={stats.unreadNotificationsCount > 0 ? "red" : "gray"}
          />
          <StatCard
            icon={<EyeOpenIcon width={20} height={20} />}
            label="File Views"
            value={formatNumber(stats.fileAccessCount)}
            color="green"
          />
        </Grid>

        <Flex direction="column" gap="3">
          <Heading size="5">Quick Actions</Heading>
          <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="4">
            <QuickActionCard
              icon={<UploadIcon width={20} height={20} />}
              title="Request Upload"
              description="Submit a new upload request"
              onClick={() => setDialogOpen(true)}
              color="violet"
            />
            <QuickActionCard
              icon={<FileTextIcon width={20} height={20} />}
              title="My Requests"
              description="Review recent file requests"
              href="/dashboard/requests"
              color="blue"
            />
            <QuickActionCard
              icon={<BellIcon width={20} height={20} />}
              title="Notifications"
              description="View all alerts"
              href="/notifications"
              color="orange"
            />
            {isAdmin && (
              <QuickActionCard
                icon={<LockClosedIcon width={20} height={20} />}
                title="Admin Panel"
                description="Open the admin dashboard"
                href="/admin"
                color="red"
              />
            )}
          </Grid>
        </Flex>

        <Grid columns={{ initial: "1", md: "2" }} gap="4">
          <RecentRequestsCard requests={recentRequests} />
          <RecentNotificationsCard notifications={recentNotifications} />
        </Grid>
      </Flex>

      <UploadRequestDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        activeClasses={activeClasses}
      />
    </>
  );
}
