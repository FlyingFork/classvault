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
  status: string;
  description: string | null;
  requestedAt: string;
  respondedAt: string | null;
  rejectionReason: string | null;
  className: string;
  classId: string;
  userName: string;
  userEmail: string;
  respondedByName: string | null;
  fileId: string | null;
}

interface RequestsListClientProps {
  requests: RequestData[];
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

export function RequestsListClient({ requests }: RequestsListClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.fileName.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.userName.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.className.toLowerCase().includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchValue, statusFilter]);

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
            href={`/admin/requests/${item.id}`}
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
      key: "user",
      header: "Requester",
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
      key: "class",
      header: "Class",
      render: (item) => (
        <Badge variant="soft" color="gray">
          {item.className}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Requested",
      width: "120px",
      render: (item) => (
        <Text size="2" color="gray">
          {formatDate(item.requestedAt)}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (item) => (
        <StatusBadge
          status={item.status as "pending" | "approved" | "rejected"}
        />
      ),
    },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/requests", name: "Requests" },
      ]}
    >
      <Heading size="6">Upload Requests</Heading>

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
        searchPlaceholder="Search requests..."
        emptyState={
          <EmptyState
            icon={<ClockIcon width={32} height={32} />}
            title="No requests found"
            description={
              searchValue || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Upload requests will appear here"
            }
          />
        }
      />
    </AdminPageLayout>
  );
}
