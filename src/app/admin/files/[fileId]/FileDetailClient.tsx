"use client";

import { useState } from "react";
import {
  Card,
  Flex,
  Heading,
  Button,
  Text,
  Badge,
  Separator,
  Table,
  AlertDialog,
  Dialog,
  TextField,
} from "@radix-ui/themes";
import {
  DownloadIcon,
  TrashIcon,
  ResetIcon,
  ClockIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminPageLayout,
  StatusBadge,
  EmptyState,
} from "@/app/components/admin";
import {
  softDeleteFileAction,
  restoreFileAction,
  renameFileAction,
} from "../actions";

interface FileData {
  id: string;
  originalFileName: string;
  fileType: string;
  size: number;
  description: string | null;
  version: number;
  isApproved: boolean;
  isDeleted: boolean;
  isCurrentVersion: boolean;
  externalVpsUrl: string;
  uploadedAt: string;
  approvedAt: string | null;
  deletedAt: string | null;
  classId: string;
  className: string;
  uploadedByName: string;
  approvedByName: string | null;
  deletedByName: string | null;
}

interface VersionData {
  id: string;
  version: number;
  isCurrentVersion: boolean;
  isDeleted: boolean;
  uploadedAt: string;
  uploadedByName: string;
}

interface AccessLogData {
  id: string;
  accessedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userName: string;
  userEmail: string;
}

interface FileDetailClientProps {
  file: FileData;
  versions: VersionData[];
  accessLogs: AccessLogData[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

export function FileDetailClient({
  file,
  versions,
  accessLogs,
}: FileDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newFileName, setNewFileName] = useState(file.originalFileName);

  const handleDelete = async () => {
    setLoading(true);
    const result = await softDeleteFileAction(file.id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File deleted");
      router.refresh();
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const result = await restoreFileAction(file.id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File restored");
      router.refresh();
    }
  };

  const handleRename = async () => {
    if (!newFileName.trim() || newFileName.trim() === file.originalFileName) {
      setRenameOpen(false);
      return;
    }

    setLoading(true);
    const result = await renameFileAction(file.id, newFileName.trim());
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("File renamed");
      setRenameOpen(false);
      router.refresh();
    }
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/files", name: "Files" },
        { url: `/admin/files/${file.id}`, name: file.originalFileName },
      ]}
      maxWidth="900px"
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex align="center" gap="3" wrap="wrap">
          <Heading size="6">{file.originalFileName}</Heading>
          <Badge size="2" variant="soft">
            v{file.version}
          </Badge>
          {file.isDeleted ? (
            <StatusBadge status="inactive" size="2" />
          ) : file.isApproved ? (
            <StatusBadge status="approved" size="2" />
          ) : (
            <StatusBadge status="pending" size="2" />
          )}
          {file.isCurrentVersion && (
            <Badge color="green" size="2">
              Current Version
            </Badge>
          )}
        </Flex>

        <Button asChild variant="soft">
          <a href={`/api/files/${file.id}/download`} download>
            <DownloadIcon />
            Download
          </a>
        </Button>
      </Flex>

      {/* File Details */}
      <Card size="3">
        <Flex direction="column" gap="4">
          <Heading size="4">File Details</Heading>

          <Flex direction="column" gap="3">
            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                File Name
              </Text>
              <Text size="2" weight="medium">
                {file.originalFileName}
              </Text>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                File Type
              </Text>
              <Badge variant="soft">{file.fileType}</Badge>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Size
              </Text>
              <Text size="2">{formatFileSize(file.size)}</Text>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Class
              </Text>
              <Link href={`/admin/classes/${file.classId}`}>
                <Badge variant="soft" color="violet">
                  {file.className}
                </Badge>
              </Link>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Uploaded By
              </Text>
              <Text size="2">{file.uploadedByName}</Text>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Uploaded At
              </Text>
              <Text size="2">{formatDate(file.uploadedAt)}</Text>
            </Flex>

            {file.approvedAt && (
              <>
                <Separator size="4" />
                <Flex justify="between" wrap="wrap" gap="2">
                  <Text size="2" color="gray">
                    Approved
                  </Text>
                  <Flex direction="column" align="end" gap="1">
                    <Text size="2">{formatDate(file.approvedAt)}</Text>
                    {file.approvedByName && (
                      <Text size="1" color="gray">
                        by {file.approvedByName}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              </>
            )}

            {file.deletedAt && (
              <>
                <Separator size="4" />
                <Flex justify="between" wrap="wrap" gap="2">
                  <Text size="2" color="gray">
                    Deleted
                  </Text>
                  <Flex direction="column" align="end" gap="1">
                    <Text size="2" color="red">
                      {formatDate(file.deletedAt)}
                    </Text>
                    {file.deletedByName && (
                      <Text size="1" color="gray">
                        by {file.deletedByName}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              </>
            )}

            {file.description && (
              <>
                <Separator size="4" />
                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">
                    Description
                  </Text>
                  <Text size="2">{file.description}</Text>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Actions */}
      <Card size="3">
        <Flex direction="column" gap="4">
          <Heading size="4">Actions</Heading>

          {/* Rename Action */}
          <Flex align="center" justify="between" wrap="wrap" gap="3">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">
                Rename File
              </Text>
              <Text size="1" color="gray">
                Change the display name of this file
              </Text>
            </Flex>

            <Dialog.Root open={renameOpen} onOpenChange={setRenameOpen}>
              <Dialog.Trigger>
                <Button variant="soft" disabled={loading}>
                  <Pencil1Icon />
                  Rename
                </Button>
              </Dialog.Trigger>
              <Dialog.Content maxWidth="400px">
                <Dialog.Title>Rename File</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  Enter a new display name for this file. This does not affect
                  the stored file.
                </Dialog.Description>
                <TextField.Root
                  placeholder="File name"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRename();
                    }
                  }}
                />
                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleRename}
                    disabled={loading || !newFileName.trim()}
                  >
                    Save
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>

          <Separator size="4" />

          {/* Delete/Restore Action */}
          <Flex align="center" justify="between" wrap="wrap" gap="3">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">
                {file.isDeleted ? "Restore File" : "Delete File"}
              </Text>
              <Text size="1" color="gray">
                {file.isDeleted
                  ? "Restore this file to make it accessible again"
                  : "Soft delete this file. It can be restored later."}
              </Text>
            </Flex>

            {file.isDeleted ? (
              <Button
                variant="soft"
                color="green"
                onClick={handleRestore}
                disabled={loading}
              >
                <ResetIcon />
                Restore
              </Button>
            ) : (
              <AlertDialog.Root>
                <AlertDialog.Trigger>
                  <Button variant="soft" color="red" disabled={loading}>
                    <TrashIcon />
                    Delete
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="400px">
                  <AlertDialog.Title>Delete File</AlertDialog.Title>
                  <AlertDialog.Description size="2">
                    Are you sure you want to delete this file? It will be hidden
                    from users but can be restored later.
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button color="red" onClick={handleDelete}>
                        Delete
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Version History */}
      {versions.length > 1 && (
        <Card size="3">
          <Flex direction="column" gap="4">
            <Heading size="4">Version History</Heading>

            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Uploaded By</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Uploaded At</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {versions.map((v) => (
                  <Table.Row key={v.id}>
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Link
                          href={`/admin/files/${v.id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <Text
                            color={v.id === file.id ? undefined : "violet"}
                            weight={v.id === file.id ? "bold" : "regular"}
                          >
                            v{v.version}
                          </Text>
                        </Link>
                        {v.isCurrentVersion && (
                          <Badge size="1" color="green">
                            Current
                          </Badge>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2">{v.uploadedByName}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatDate(v.uploadedAt)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      {v.isDeleted ? (
                        <StatusBadge status="inactive" />
                      ) : (
                        <StatusBadge status="active" />
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Card>
      )}

      {/* Access Logs */}
      <Card size="3">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">Access Logs</Heading>
            <Button asChild variant="soft" size="1">
              <Link href={`/admin/logs?fileId=${file.id}`}>View All</Link>
            </Button>
          </Flex>

          {accessLogs.length === 0 ? (
            <EmptyState
              icon={<ClockIcon width={32} height={32} />}
              title="No access logs"
              description="File downloads will be logged here"
            />
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>User</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>IP Address</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Accessed At</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {accessLogs.map((log) => (
                  <Table.Row key={log.id}>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text size="2">{log.userName}</Text>
                        <Text size="1" color="gray">
                          {log.userEmail}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {log.ipAddress || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatDate(log.accessedAt)}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Flex>
      </Card>
    </AdminPageLayout>
  );
}
