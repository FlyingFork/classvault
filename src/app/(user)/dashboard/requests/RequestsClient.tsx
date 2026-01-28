"use client";

import { useState, useMemo } from "react";
import { Flex, Heading, Text, Tabs, Badge } from "@radix-ui/themes";
import { ClockIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import {
  AdminPageLayout,
  DataTable,
  StatusBadge,
  EmptyState,
} from "@/app/components/admin";
import type { Column } from "@/app/components/admin";

interface RequestData {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  status: "pending" | "approved" | "rejected";
  description: string | null;
  requestedAt: string;
  respondedAt: string | null;
  rejectionReason: string | null;
  className: string;
  classId: string;
  fileId: string | null;
  basedOnFileId: string | null;
}

interface RequestsClientProps {
  requests: RequestData[];
  totalCount: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RequestsClient({ requests }: RequestsClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortValue, setSortValue] = useState("requestedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredRequests = useMemo(() => {
    let result = requests.filter((r) => {
      const matchesSearch =
        r.fileName.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.className.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortValue) {
        case "fileName":
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case "className":
          comparison = a.className.localeCompare(b.className);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "requestedAt":
        default:
          comparison =
            new Date(a.requestedAt).getTime() -
            new Date(b.requestedAt).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [requests, searchValue, statusFilter, sortValue, sortOrder]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const columns: Column<RequestData>[] = [
    {
      key: "file",
      header: "File",
      render: (item) => (
        <Flex direction="column" gap="1">
          <Link
            href={`/dashboard/requests/${item.id}`}
            style={{ textDecoration: "none" }}
          >
            <Text weight="medium" color="violet">
              {item.fileName}
            </Text>
          </Link>
          <Text size="1" color="gray">
            {formatFileSize(item.size)}
          </Text>
        </Flex>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (item) => (
        <Badge variant="soft" color="gray">
          {item.className}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "created",
      header: "Created",
      width: "120px",
      render: (item) => (
        <Text size="2" color="gray">
          {formatDate(item.requestedAt)}
        </Text>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      width: "120px",
      render: (item) => (
        <Text size="2" color="gray">
          {item.respondedAt ? formatDate(item.respondedAt) : "-"}
        </Text>
      ),
    },
  ];

  const sortOptions = [
    { value: "requestedAt", label: "Date Created" },
    { value: "fileName", label: "File Name" },
    { value: "className", label: "Class" },
    { value: "status", label: "Status" },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/dashboard/requests", name: "My Requests" },
      ]}
    >
      <Heading size="6">My Upload Requests</Heading>

      <Tabs.Root value={statusFilter} onValueChange={setStatusFilter}>
        <Tabs.List>
          <Tabs.Trigger value="all">All ({requests.length})</Tabs.Trigger>
          <Tabs.Trigger value="pending">Pending ({pendingCount})</Tabs.Trigger>
          <Tabs.Trigger value="approved">
            Approved ({approvedCount})
          </Tabs.Trigger>
          <Tabs.Trigger value="rejected">
            Rejected ({rejectedCount})
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <DataTable
        data={filteredRequests}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search by file or class..."
        sortOptions={sortOptions}
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        emptyState={
          <EmptyState
            icon={<ClockIcon width={32} height={32} />}
            title={
              searchValue || statusFilter !== "all"
                ? "No matching requests"
                : "No upload requests yet"
            }
            description={
              searchValue || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "When you request file uploads, they'll appear here"
            }
            actionLabel={
              !searchValue && statusFilter === "all"
                ? "Request Upload"
                : undefined
            }
            actionHref={
              !searchValue && statusFilter === "all" ? "/dashboard" : undefined
            }
          />
        }
      />
    </AdminPageLayout>
  );
}
