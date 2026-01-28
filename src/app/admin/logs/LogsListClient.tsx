"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Flex,
  Heading,
  Text,
  Select,
  Grid,
  Badge,
} from "@radix-ui/themes";
import { ActivityLogIcon, BarChartIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageLayout, DataTable, EmptyState } from "@/app/components/admin";
import type { Column } from "@/app/components/admin";

interface LogData {
  id: string;
  accessedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  fileId: string;
  fileName: string;
  userId: string | null; // Nullable for anonymous downloads
  userName: string;
  userEmail: string;
}

interface MostAccessedFile {
  fileId: string;
  fileName: string;
  classId: string;
  className: string;
  accessCount: number;
}

interface FilterOption {
  id: string;
  name: string;
}

interface LogsListClientProps {
  logs: LogData[];
  mostAccessed: MostAccessedFile[];
  files: FilterOption[];
  users: FilterOption[];
  initialFileFilter?: string;
  initialUserFilter?: string;
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

export function LogsListClient({
  logs,
  mostAccessed,
  files,
  users,
  initialFileFilter,
  initialUserFilter,
}: LogsListClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [fileFilter, setFileFilter] = useState(initialFileFilter || "all");
  const [userFilter, setUserFilter] = useState(initialUserFilter || "all");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.fileName.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.ipAddress?.toLowerCase().includes(searchValue.toLowerCase());
      const matchesFile = fileFilter === "all" || log.fileId === fileFilter;
      const matchesUser = userFilter === "all" || log.userId === userFilter;
      return matchesSearch && matchesFile && matchesUser;
    });
  }, [logs, searchValue, fileFilter, userFilter]);

  const handleFilterChange = (type: "file" | "user", value: string) => {
    const params = new URLSearchParams();
    if (type === "file") {
      setFileFilter(value);
      if (value !== "all") params.set("fileId", value);
      if (userFilter !== "all") params.set("userId", userFilter);
    } else {
      setUserFilter(value);
      if (fileFilter !== "all") params.set("fileId", fileFilter);
      if (value !== "all") params.set("userId", value);
    }
    router.push(
      `/admin/logs${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  const columns: Column<LogData>[] = [
    {
      key: "file",
      header: "File",
      render: (item) => (
        <Link
          href={`/admin/files/${item.fileId}`}
          style={{ textDecoration: "none" }}
        >
          <Text color="violet" weight="medium">
            {item.fileName}
          </Text>
        </Link>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (item) => (
        <Flex direction="column" gap="1">
          <Text size="2">{item.userName}</Text>
          <Text size="1" color="gray">
            {item.userEmail}
          </Text>
        </Flex>
      ),
    },
    {
      key: "ip",
      header: "IP Address",
      width: "130px",
      render: (item) => (
        <Text size="2" color="gray">
          {item.ipAddress || "-"}
        </Text>
      ),
    },
    {
      key: "date",
      header: "Accessed At",
      width: "160px",
      render: (item) => (
        <Text size="2" color="gray">
          {formatDate(item.accessedAt)}
        </Text>
      ),
    },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/logs", name: "Access Logs" },
      ]}
    >
      <Heading size="6">Access Logs</Heading>

      {/* Most Accessed Files */}
      <Card size="2">
        <Flex direction="column" gap="4">
          <Flex align="center" gap="2">
            <BarChartIcon width={18} height={18} />
            <Heading size="4">Most Accessed Files (Last 30 Days)</Heading>
          </Flex>

          {mostAccessed.length === 0 ? (
            <Text size="2" color="gray">
              No file access data available
            </Text>
          ) : (
            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3">
              {mostAccessed.slice(0, 6).map((file, index) => (
                <Link
                  key={file.fileId}
                  href={`/admin/files/${file.fileId}`}
                  style={{ textDecoration: "none" }}
                >
                  <Flex
                    align="center"
                    gap="3"
                    p="3"
                    style={{
                      backgroundColor: "var(--gray-a2)",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-2)",
                        backgroundColor: "var(--accent-a3)",
                        color: "var(--accent-11)",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {index + 1}
                    </Flex>
                    <Flex
                      direction="column"
                      gap="1"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Text size="2" weight="medium" truncate>
                        {file.fileName}
                      </Text>
                      <Flex gap="2" align="center">
                        <Badge size="1" variant="soft">
                          {file.className}
                        </Badge>
                        <Text size="1" color="gray">
                          {file.accessCount} downloads
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                </Link>
              ))}
            </Grid>
          )}
        </Flex>
      </Card>

      {/* Filters */}
      <Card size="2">
        <Flex
          gap="4"
          wrap="wrap"
          direction={{ initial: "column", sm: "row" }}
          align={{ initial: "stretch", sm: "center" }}
        >
          <Flex gap="2" align="center">
            <Text size="2" color="gray">
              File:
            </Text>
            <Select.Root
              value={fileFilter}
              onValueChange={(value) => handleFilterChange("file", value)}
            >
              <Select.Trigger
                placeholder="All files"
                style={{ minWidth: 180 }}
              />
              <Select.Content>
                <Select.Item value="all">All Files</Select.Item>
                {files.map((f) => (
                  <Select.Item key={f.id} value={f.id}>
                    {f.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex gap="2" align="center">
            <Text size="2" color="gray">
              User:
            </Text>
            <Select.Root
              value={userFilter}
              onValueChange={(value) => handleFilterChange("user", value)}
            >
              <Select.Trigger
                placeholder="All users"
                style={{ minWidth: 180 }}
              />
              <Select.Content>
                <Select.Item value="all">All Users</Select.Item>
                {users.map((u) => (
                  <Select.Item key={u.id} value={u.id}>
                    {u.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
        </Flex>
      </Card>

      {/* Logs Table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search logs..."
        emptyState={
          <EmptyState
            icon={<ActivityLogIcon width={32} height={32} />}
            title="No access logs found"
            description="File access events will be logged here"
          />
        }
      />
    </AdminPageLayout>
  );
}
