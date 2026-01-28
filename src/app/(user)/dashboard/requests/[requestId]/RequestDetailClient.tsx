"use client";

import { useState } from "react";
import {
  Flex,
  Card,
  Heading,
  Text,
  Button,
  Badge,
  Callout,
  Separator,
  AlertDialog,
} from "@radix-ui/themes";
import {
  FileTextIcon,
  DownloadIcon,
  UpdateIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageLayout, StatusBadge } from "@/app/components/admin";
import { cancelUploadRequest } from "@/app/(user)/dashboard/actions";
import { UpdateVersionDialog } from "./UpdateVersionDialog";

interface RequestInfo {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  status: "pending" | "approved" | "rejected";
  description: string | null;
  requestedAt: string;
  respondedAt: string | null;
  rejectionReason: string | null;
  classId: string;
  className: string;
  allowedFileTypes: string[];
  respondedByName: string | null;
  fileId: string | null;
  fileVersion: number | null;
  basedOnFileId: string | null;
  basedOnFileName: string | null;
  basedOnFileVersion: number | null;
  hasPendingFile: boolean;
}

interface RequestDetailClientProps {
  request: RequestInfo;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getFileTypeLabel(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "text/markdown": "Markdown",
    "text/plain": "Text",
    "image/png": "PNG",
    "image/jpeg": "JPEG",
  };
  return typeMap[mimeType] || mimeType.split("/")[1]?.toUpperCase() || "File";
}

export function RequestDetailClient({ request }: RequestDetailClientProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelUploadRequest(request.id);
      if (result.success) {
        toast.success("Request cancelled");
        router.push("/dashboard/requests");
      } else {
        toast.error(result.error || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownload = () => {
    if (request.fileId) {
      window.open(`/api/files/${request.fileId}`, "_blank");
    }
  };

  const isUpdateRequest = !!request.basedOnFileId;
  const canDownload = request.status === "approved" && request.fileId;
  const canUpdate = request.status === "approved" && request.fileId;
  const canCancel = request.status === "pending";

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/dashboard/requests", name: "My Requests" },
        { url: `/dashboard/requests/${request.id}`, name: request.fileName },
      ]}
    >
      {/* Main Details Card */}
      <Card size="3">
        <Flex direction="column" gap="4">
          {/* Header */}
          <Flex justify="between" align="start" gap="4" wrap="wrap">
            <Flex align="center" gap="3">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-3)",
                  backgroundColor: "var(--violet-a3)",
                }}
              >
                <FileTextIcon width={24} height={24} color="var(--violet-11)" />
              </Flex>
              <Flex direction="column" gap="1">
                <Heading size="5">{request.fileName}</Heading>
                <Flex gap="2" align="center" wrap="wrap">
                  <Badge variant="soft" color="gray">
                    {request.className}
                  </Badge>
                  <Badge variant="soft">
                    {getFileTypeLabel(request.fileType)}
                  </Badge>
                  <Text size="1" color="gray">
                    {formatFileSize(request.size)}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
            <StatusBadge status={request.status} size="2" />
          </Flex>

          <Separator size="4" />

          {/* Metadata */}
          <Flex direction="column" gap="3">
            <Flex gap="6" wrap="wrap">
              <Flex direction="column" gap="1">
                <Text size="1" color="gray" weight="medium">
                  Submitted
                </Text>
                <Text size="2">{formatDate(request.requestedAt)}</Text>
              </Flex>

              {request.respondedAt && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Responded
                  </Text>
                  <Text size="2">{formatDate(request.respondedAt)}</Text>
                </Flex>
              )}

              {request.respondedByName && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Reviewed By
                  </Text>
                  <Text size="2">{request.respondedByName}</Text>
                </Flex>
              )}

              {request.fileVersion && (
                <Flex direction="column" gap="1">
                  <Text size="1" color="gray" weight="medium">
                    Version
                  </Text>
                  <Text size="2">v{request.fileVersion}</Text>
                </Flex>
              )}
            </Flex>

            {request.description && (
              <Flex direction="column" gap="1">
                <Text size="1" color="gray" weight="medium">
                  Description
                </Text>
                <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
                  {request.description}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Version Info Card (for update requests) */}
      {isUpdateRequest && (
        <Callout.Root color="blue">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            This is an update for{" "}
            <Text weight="medium">{request.basedOnFileName}</Text>
            {request.basedOnFileVersion && ` (v${request.basedOnFileVersion})`}.
            {request.status === "approved" &&
              ` The new version (v${request.fileVersion}) is now available.`}
            {request.status === "pending" && " Awaiting admin approval."}
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Rejection Reason */}
      {request.status === "rejected" && request.rejectionReason && (
        <Callout.Root color="red">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>
            <Text weight="medium">Rejection Reason: </Text>
            {request.rejectionReason}
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Pending Status Info */}
      {request.status === "pending" && (
        <Callout.Root color="orange">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Your request is awaiting admin review. You&apos;ll receive a
            notification once it&apos;s been processed.
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Actions */}
      <Card size="2">
        <Flex gap="3" wrap="wrap" align="center">
          {canDownload && (
            <Button variant="solid" onClick={handleDownload}>
              <DownloadIcon />
              Download File
            </Button>
          )}

          {canUpdate && (
            <Button variant="soft" onClick={() => setShowUpdateDialog(true)}>
              <UpdateIcon />
              Upload New Version
            </Button>
          )}

          {canCancel && (
            <AlertDialog.Root>
              <AlertDialog.Trigger>
                <Button variant="soft" color="red" disabled={isCancelling}>
                  <TrashIcon />
                  Cancel Request
                </Button>
              </AlertDialog.Trigger>
              <AlertDialog.Content maxWidth="450px">
                <AlertDialog.Title>Cancel Upload Request</AlertDialog.Title>
                <AlertDialog.Description size="2">
                  Are you sure you want to cancel this upload request? The
                  pending file will be deleted and this action cannot be undone.
                </AlertDialog.Description>
                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      Keep Request
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button
                      variant="solid"
                      color="red"
                      onClick={handleCancel}
                      disabled={isCancelling}
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Request"}
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>
          )}

          <Button
            variant="ghost"
            color="gray"
            onClick={() => router.push("/dashboard/requests")}
          >
            Back to Requests
          </Button>
        </Flex>
      </Card>

      {/* Update Version Dialog */}
      {canUpdate && (
        <UpdateVersionDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          fileId={request.fileId!}
          currentFileName={request.fileName}
          classId={request.classId}
          className={request.className}
          allowedFileTypes={request.allowedFileTypes}
          currentVersion={request.fileVersion || 1}
        />
      )}
    </AdminPageLayout>
  );
}
