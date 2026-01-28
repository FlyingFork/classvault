"use client";

import { useState, useMemo } from "react";
import {
  Flex,
  Heading,
  Text,
  Badge,
  Select,
  Switch,
  Card,
  DropdownMenu,
  IconButton,
} from "@radix-ui/themes";
import {
  FileTextIcon,
  DotsHorizontalIcon,
  EyeOpenIcon,
  TrashIcon,
  ResetIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminPageLayout,
  DataTable,
  StatusBadge,
  EmptyState,
} from "@/app/components/admin";
import type { Column } from "@/app/components/admin";
import { softDeleteFileAction, restoreFileAction } from "./actions";

interface FileData {
  id: string;
  originalFileName: string;
  fileType: string;
  size: number;
  version: number;
  isApproved: boolean;
  isDeleted: boolean;
  isCurrentVersion: boolean;
  uploadedAt: string;
  approvedAt: string | null;
  classId: string;
  className: string;
  uploadedByName: string;
  approvedByName: string | null;
  externalVpsUrl: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface FilesListClientProps {
  files: FileData[];
  classes: ClassOption[];
  initialClassFilter?: string;
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

export function FilesListClient({
  files,
  classes,
  initialClassFilter,
}: FilesListClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [classFilter, setClassFilter] = useState(initialClassFilter || "all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.originalFileName
        .toLowerCase()
        .includes(searchValue.toLowerCase());
      const matchesClass = classFilter === "all" || f.classId === classFilter;
      const matchesDeleted = showDeleted || !f.isDeleted;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && f.isApproved && !f.isDeleted) ||
        (statusFilter === "pending" && !f.isApproved && !f.isDeleted) ||
        (statusFilter === "deleted" && f.isDeleted);

      return matchesSearch && matchesClass && matchesDeleted && matchesStatus;
    });
  }, [files, searchValue, classFilter, showDeleted, statusFilter]);

  const handleDelete = async (fileId: string) => {
    setLoading(fileId);
    const result = await softDeleteFileAction(fileId);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File deleted");
      router.refresh();
    }
  };

  const handleRestore = async (fileId: string) => {
    setLoading(fileId);
    const result = await restoreFileAction(fileId);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File restored");
      router.refresh();
    }
  };

  const columns: Column<FileData>[] = [
    {
      key: "file",
      header: "File",
      render: (item) => (
        <Flex direction="column" gap="1">
          <Link
            href={`/admin/files/${item.id}`}
            style={{ textDecoration: "none" }}
          >
            <Text weight="medium" color="violet">
              {item.originalFileName}
            </Text>
          </Link>
          <Flex gap="2" align="center">
            <Text size="1" color="gray">
              {formatFileSize(item.size)}
            </Text>
            <Badge size="1" variant="soft">
              v{item.version}
            </Badge>
            {item.isCurrentVersion && (
              <Badge size="1" color="green" variant="soft">
                Current
              </Badge>
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      key: "class",
      header: "Class",
      render: (item) => (
        <Link
          href={`/admin/classes/${item.classId}`}
          style={{ textDecoration: "none" }}
        >
          <Badge variant="soft" color="gray">
            {item.className}
          </Badge>
        </Link>
      ),
    },
    {
      key: "uploader",
      header: "Uploaded By",
      render: (item) => (
        <Text size="2" color="gray">
          {item.uploadedByName}
        </Text>
      ),
    },
    {
      key: "date",
      header: "Uploaded",
      width: "100px",
      render: (item) => (
        <Text size="2" color="gray">
          {formatDate(item.uploadedAt)}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (item) =>
        item.isDeleted ? (
          <StatusBadge status="inactive" />
        ) : item.isApproved ? (
          <StatusBadge status="approved" />
        ) : (
          <StatusBadge status="pending" />
        ),
    },
    {
      key: "actions",
      header: "",
      width: "50px",
      render: (item) => (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="ghost" size="1" disabled={loading === item.id}>
              <DotsHorizontalIcon />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content size="1">
            <DropdownMenu.Item asChild>
              <Link href={`/admin/files/${item.id}`}>
                <EyeOpenIcon />
                View Details
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <a href={`/api/files/${item.id}/download`} download>
                <DownloadIcon />
                Download
              </a>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            {item.isDeleted ? (
              <DropdownMenu.Item
                color="green"
                onClick={() => handleRestore(item.id)}
              >
                <ResetIcon />
                Restore
              </DropdownMenu.Item>
            ) : (
              <DropdownMenu.Item
                color="red"
                onClick={() => handleDelete(item.id)}
              >
                <TrashIcon />
                Delete
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ),
    },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/files", name: "Files" },
      ]}
    >
      <Heading size="6">Files</Heading>

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
              Class:
            </Text>
            <Select.Root
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                if (value !== "all") {
                  router.push(`/admin/files?classId=${value}`);
                } else {
                  router.push("/admin/files");
                }
              }}
            >
              <Select.Trigger placeholder="All classes" />
              <Select.Content>
                <Select.Item value="all">All Classes</Select.Item>
                {classes.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex gap="2" align="center">
            <Text size="2" color="gray">
              Status:
            </Text>
            <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="all">All</Select.Item>
                <Select.Item value="approved">Approved</Select.Item>
                <Select.Item value="pending">Pending</Select.Item>
                <Select.Item value="deleted">Deleted</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex gap="2" align="center">
            <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
            <Text size="2">Show deleted</Text>
          </Flex>
        </Flex>
      </Card>

      <DataTable
        data={filteredFiles}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search files..."
        emptyState={
          <EmptyState
            icon={<FileTextIcon width={32} height={32} />}
            title="No files found"
            description="Files will appear here once upload requests are approved"
          />
        }
      />
    </AdminPageLayout>
  );
}
