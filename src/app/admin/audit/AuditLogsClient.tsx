"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  Flex,
  Heading,
  Text,
  Table,
  Badge,
  Select,
  Button,
} from "@radix-ui/themes";
import {
  ActivityLogIcon,
  Cross2Icon,
  PersonIcon,
  FileTextIcon,
  ReaderIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  Pencil1Icon,
  TrashIcon,
  ResetIcon,
  PlusIcon,
  UpdateIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { AdminPageLayout, EmptyState } from "@/app/components/admin";

interface AuditLogData {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: string | null;
  performedAt: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
}

interface AdminOption {
  id: string;
  name: string;
}

interface AuditLogsClientProps {
  logs: AuditLogData[];
  admins: AdminOption[];
  actions: string[];
  entityTypes: string[];
  totalCount: number;
  initialAdminFilter?: string;
  initialActionFilter?: string;
  initialEntityTypeFilter?: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionIcon(action: string) {
  switch (action) {
    case "approve_request":
      return <CheckCircledIcon color="var(--green-9)" />;
    case "reject_request":
      return <CrossCircledIcon color="var(--red-9)" />;
    case "delete_file":
    case "delete_class":
      return <TrashIcon color="var(--red-9)" />;
    case "restore_file":
    case "restore_class":
      return <ResetIcon color="var(--green-9)" />;
    case "rename_file":
      return <Pencil1Icon color="var(--blue-9)" />;
    case "create_class":
      return <PlusIcon color="var(--green-9)" />;
    case "update_class":
      return <UpdateIcon color="var(--blue-9)" />;
    case "ban_user":
      return <LockClosedIcon color="var(--red-9)" />;
    case "unban_user":
      return <LockOpen1Icon color="var(--green-9)" />;
    case "change_role":
      return <PersonIcon color="var(--violet-9)" />;
    case "reset_password":
      return <LockClosedIcon color="var(--orange-9)" />;
    default:
      return <ActivityLogIcon />;
  }
}

function getActionColor(
  action: string,
): "green" | "red" | "blue" | "orange" | "violet" | "gray" {
  if (
    action.includes("approve") ||
    action.includes("restore") ||
    action.includes("create") ||
    action.includes("unban")
  ) {
    return "green";
  }
  if (
    action.includes("reject") ||
    action.includes("delete") ||
    action.includes("ban")
  ) {
    return "red";
  }
  if (action.includes("rename") || action.includes("update")) {
    return "blue";
  }
  if (action.includes("reset")) {
    return "orange";
  }
  if (action.includes("role")) {
    return "violet";
  }
  return "gray";
}

function getEntityIcon(entityType: string) {
  switch (entityType) {
    case "file":
      return <FileTextIcon />;
    case "class":
      return <ReaderIcon />;
    case "user":
      return <PersonIcon />;
    case "request":
      return <ActivityLogIcon />;
    default:
      return <ActivityLogIcon />;
  }
}

function formatActionName(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getEntityLink(entityType: string, entityId: string): string | null {
  switch (entityType) {
    case "file":
      return `/admin/files/${entityId}`;
    case "class":
      return `/admin/classes/${entityId}`;
    case "user":
      return `/admin/users/${entityId}`;
    case "request":
      return `/admin/requests/${entityId}`;
    default:
      return null;
  }
}

export function AuditLogsClient({
  logs,
  admins,
  actions,
  entityTypes,
  totalCount,
  initialAdminFilter,
  initialActionFilter,
  initialEntityTypeFilter,
}: AuditLogsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/audit?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/admin/audit");
  };

  const hasFilters =
    initialAdminFilter || initialActionFilter || initialEntityTypeFilter;

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/audit", name: "Audit Logs" },
      ]}
      maxWidth="1200px"
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <ActivityLogIcon width={24} height={24} />
          <Heading size="6">Admin Audit Logs</Heading>
          <Badge variant="soft">{totalCount} total</Badge>
        </Flex>
      </Flex>

      {/* Filters */}
      <Card size="2">
        <Flex gap="3" wrap="wrap" align="end">
          <Flex direction="column" gap="1">
            <Text size="1" color="gray" weight="medium">
              Admin
            </Text>
            <Select.Root
              value={initialAdminFilter || "all"}
              onValueChange={(value) =>
                updateFilter("adminId", value === "all" ? undefined : value)
              }
            >
              <Select.Trigger placeholder="All Admins" />
              <Select.Content>
                <Select.Item value="all">All Admins</Select.Item>
                {admins.map((admin) => (
                  <Select.Item key={admin.id} value={admin.id}>
                    {admin.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="1" color="gray" weight="medium">
              Action
            </Text>
            <Select.Root
              value={initialActionFilter || "all"}
              onValueChange={(value) =>
                updateFilter("action", value === "all" ? undefined : value)
              }
            >
              <Select.Trigger placeholder="All Actions" />
              <Select.Content>
                <Select.Item value="all">All Actions</Select.Item>
                {actions.map((action) => (
                  <Select.Item key={action} value={action}>
                    {formatActionName(action)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="1" color="gray" weight="medium">
              Entity Type
            </Text>
            <Select.Root
              value={initialEntityTypeFilter || "all"}
              onValueChange={(value) =>
                updateFilter("entityType", value === "all" ? undefined : value)
              }
            >
              <Select.Trigger placeholder="All Types" />
              <Select.Content>
                <Select.Item value="all">All Types</Select.Item>
                {entityTypes.map((type) => (
                  <Select.Item key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          {hasFilters && (
            <Button variant="soft" color="gray" onClick={clearFilters}>
              <Cross2Icon />
              Clear Filters
            </Button>
          )}
        </Flex>
      </Card>

      {/* Logs Table */}
      <Card size="3">
        {logs.length === 0 ? (
          <EmptyState
            icon={<ActivityLogIcon width={32} height={32} />}
            title="No audit logs"
            description={
              hasFilters
                ? "No logs match your filters"
                : "Admin actions will be logged here"
            }
          />
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Entity</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Admin</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Time</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.map((log) => {
                const entityLink = getEntityLink(log.entityType, log.entityId);
                return (
                  <Table.Row key={log.id}>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        {getActionIcon(log.action)}
                        <Badge
                          color={getActionColor(log.action)}
                          variant="soft"
                        >
                          {formatActionName(log.action)}
                        </Badge>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        {getEntityIcon(log.entityType)}
                        {entityLink ? (
                          <Link
                            href={entityLink}
                            style={{
                              textDecoration: "none",
                              color: "var(--accent-11)",
                            }}
                          >
                            <Text size="2">
                              {log.entityType}: {log.entityId.slice(0, 8)}...
                            </Text>
                          </Link>
                        ) : (
                          <Text size="2" color="gray">
                            {log.entityType}: {log.entityId.slice(0, 8)}...
                          </Text>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text
                        size="2"
                        style={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                        }}
                        title={log.description}
                      >
                        {log.description}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text size="2">{log.adminName}</Text>
                        <Text size="1" color="gray">
                          {log.adminEmail}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatDate(log.performedAt)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Card>
    </AdminPageLayout>
  );
}
