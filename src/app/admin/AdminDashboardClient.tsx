"use client";

import {
  Card,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Separator,
} from "@radix-ui/themes";
import {
  PersonIcon,
  FileTextIcon,
  ClockIcon,
  ReaderIcon,
  PlusIcon,
  ArchiveIcon,
  ActivityLogIcon,
  CheckCircledIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { AdminPageLayout } from "@/app/components/admin";
import { StatCard } from "@/app/components/admin/StatCard";
import { QuickActionCard } from "@/app/components/admin/QuickActionCard";
import { StatusBadge } from "@/app/components/admin/StatusBadge";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalClasses: number;
    pendingRequests: number;
    totalFiles: number;
  };
  recentRequests: {
    id: string;
    fileName: string;
    userName: string;
    className: string;
    requestedAt: string;
  }[];
  recentActivity: {
    id: string;
    fileName: string;
    status: string;
    userName: string;
    respondedByName: string;
    respondedAt: string | null;
  }[];
}

interface AdminDashboardClientProps {
  data: DashboardData;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const { stats, recentRequests, recentActivity } = data;

  return (
    <AdminPageLayout breadcrumbs={[{ url: "/admin", name: "Admin Dashboard" }]}>
      {/* Stats Grid */}
      <Grid columns={{ initial: "2", sm: "4" }} gap="4">
        <StatCard
          icon={<PersonIcon width={20} height={20} />}
          label="Total Users"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<ReaderIcon width={20} height={20} />}
          label="Active Classes"
          value={stats.totalClasses}
          color="green"
        />
        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          label="Pending Requests"
          value={stats.pendingRequests}
          color={stats.pendingRequests > 0 ? "orange" : "gray"}
        />
        <StatCard
          icon={<FileTextIcon width={20} height={20} />}
          label="Total Files"
          value={stats.totalFiles}
          color="violet"
        />
      </Grid>

      {/* Main Content Grid */}
      <Grid columns={{ initial: "1", md: "2" }} gap="4">
        {/* Pending Approvals */}
        <Card size="2">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Heading size="4">Pending Approvals</Heading>
              {stats.pendingRequests > 0 && (
                <Button asChild size="1" variant="soft">
                  <Link href="/admin/requests">View All</Link>
                </Button>
              )}
            </Flex>

            {recentRequests.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py="6"
                gap="2"
              >
                <CheckCircledIcon
                  width={32}
                  height={32}
                  color="var(--green-9)"
                />
                <Text size="2" color="gray">
                  No pending requests
                </Text>
              </Flex>
            ) : (
              <Flex direction="column" gap="3">
                {recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/admin/requests/${request.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Flex
                      justify="between"
                      align="center"
                      p="3"
                      style={{
                        backgroundColor: "var(--gray-a2)",
                        borderRadius: "var(--radius-2)",
                        cursor: "pointer",
                      }}
                    >
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          {request.fileName}
                        </Text>
                        <Flex gap="2" align="center">
                          <Text size="1" color="gray">
                            {request.userName}
                          </Text>
                          <Text size="1" color="gray">
                            •
                          </Text>
                          <Text size="1" color="gray">
                            {request.className}
                          </Text>
                        </Flex>
                      </Flex>
                      <Text size="1" color="gray">
                        {formatTimeAgo(request.requestedAt)}
                      </Text>
                    </Flex>
                  </Link>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Quick Actions */}
        <Card size="2">
          <Flex direction="column" gap="4">
            <Heading size="4">Quick Actions</Heading>
            <Grid columns="2" gap="3">
              <QuickActionCard
                icon={<PlusIcon width={20} height={20} />}
                title="New Class"
                description="Create a new class"
                href="/admin/classes/new"
                color="green"
              />
              <QuickActionCard
                icon={<ClockIcon width={20} height={20} />}
                title="Requests"
                description="Review pending requests"
                href="/admin/requests"
                color="orange"
              />
              <QuickActionCard
                icon={<PersonIcon width={20} height={20} />}
                title="Users"
                description="Manage users"
                href="/admin/users"
                color="blue"
              />
              <QuickActionCard
                icon={<FileTextIcon width={20} height={20} />}
                title="Files"
                description="Manage all files"
                href="/admin/files"
                color="violet"
              />
              <QuickActionCard
                icon={<ActivityLogIcon width={20} height={20} />}
                title="Access Logs"
                description="View file access logs"
                href="/admin/logs"
                color="gray"
              />
              <QuickActionCard
                icon={<ArchiveIcon width={20} height={20} />}
                title="Audit Logs"
                description="Admin action history"
                href="/admin/audit"
                color="gray"
              />
            </Grid>
          </Flex>
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Card size="2">
        <Flex direction="column" gap="4">
          <Heading size="4">Recent Activity</Heading>
          {recentActivity.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py="6"
              gap="2"
            >
              <ArchiveIcon width={32} height={32} color="var(--gray-9)" />
              <Text size="2" color="gray">
                No recent activity
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap="1">
              {recentActivity.map((activity, index) => (
                <Flex key={activity.id} direction="column">
                  <Flex
                    justify="between"
                    align="center"
                    py="3"
                    wrap="wrap"
                    gap="2"
                  >
                    <Flex align="center" gap="3">
                      {activity.status === "approved" ? (
                        <CheckCircledIcon
                          width={18}
                          height={18}
                          color="var(--green-9)"
                        />
                      ) : (
                        <CrossCircledIcon
                          width={18}
                          height={18}
                          color="var(--red-9)"
                        />
                      )}
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Text size="2" weight="medium">
                            {activity.fileName}
                          </Text>
                          <StatusBadge
                            status={activity.status as "approved" | "rejected"}
                          />
                        </Flex>
                        <Text size="1" color="gray">
                          {activity.userName} • by {activity.respondedByName}
                        </Text>
                      </Flex>
                    </Flex>
                    <Text size="1" color="gray">
                      {activity.respondedAt
                        ? formatTimeAgo(activity.respondedAt)
                        : "-"}
                    </Text>
                  </Flex>
                  {index < recentActivity.length - 1 && <Separator size="4" />}
                </Flex>
              ))}
            </Flex>
          )}
        </Flex>
      </Card>
    </AdminPageLayout>
  );
}
