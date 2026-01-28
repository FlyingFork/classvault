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
  Dialog,
  TextArea,
  Callout,
} from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageLayout, StatusBadge } from "@/app/components/admin";
import { approveRequestAction, rejectRequestAction } from "../actions";

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
  classId: string;
  className: string;
  allowedFileTypes: string[];
  userName: string;
  userEmail: string;
  respondedByName: string | null;
  fileId: string | null;
  basedOnFileId: string | null;
  basedOnFileName: string | null;
  hasPendingFile: boolean;
}

interface RequestDetailClientProps {
  request: RequestData;
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

export function RequestDetailClient({ request }: RequestDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isPending = request.status === "pending";

  const handleApprove = async () => {
    if (!request.hasPendingFile) {
      toast.error("No file associated with this request");
      return;
    }

    setLoading(true);

    try {
      const result = await approveRequestAction(request.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Request approved successfully");
        router.push("/admin/requests");
      }
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve request");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    const result = await rejectRequestAction(request.id, rejectionReason);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Request rejected");
      setRejectDialogOpen(false);
      router.push("/admin/requests");
    }
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/requests", name: "Requests" },
        { url: `/admin/requests/${request.id}`, name: request.fileName },
      ]}
      maxWidth="800px"
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex align="center" gap="3">
          <Heading size="6">{request.fileName}</Heading>
          <StatusBadge
            status={request.status as "pending" | "approved" | "rejected"}
            size="2"
          />
        </Flex>

        {/* Download button for pending file */}
        {isPending && request.hasPendingFile && (
          <Button asChild variant="soft">
            <a
              href={`/api/requests/${request.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
              Download File
            </a>
          </Button>
        )}
      </Flex>

      {/* Request Details */}
      <Card size="3">
        <Flex direction="column" gap="4">
          <Heading size="4">Request Details</Heading>

          <Flex direction="column" gap="3">
            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                File Name
              </Text>
              <Text size="2" weight="medium">
                {request.fileName}
              </Text>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                File Type
              </Text>
              <Badge variant="soft">{request.fileType}</Badge>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Size
              </Text>
              <Text size="2">{formatFileSize(request.size)}</Text>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Class
              </Text>
              <Link href={`/admin/classes/${request.classId}`}>
                <Badge variant="soft" color="violet">
                  {request.className}
                </Badge>
              </Link>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Requested By
              </Text>
              <Flex direction="column" align="end" gap="1">
                <Text size="2" weight="medium">
                  {request.userName}
                </Text>
                <Text size="1" color="gray">
                  {request.userEmail}
                </Text>
              </Flex>
            </Flex>
            <Separator size="4" />

            <Flex justify="between" wrap="wrap" gap="2">
              <Text size="2" color="gray">
                Requested At
              </Text>
              <Text size="2">{formatDate(request.requestedAt)}</Text>
            </Flex>

            {request.basedOnFileId && (
              <>
                <Separator size="4" />
                <Flex justify="between" wrap="wrap" gap="2">
                  <Text size="2" color="gray">
                    Updating File
                  </Text>
                  <Link href={`/admin/files/${request.basedOnFileId}`}>
                    <Text size="2" color="violet">
                      {request.basedOnFileName}
                    </Text>
                  </Link>
                </Flex>
              </>
            )}

            {request.description && (
              <>
                <Separator size="4" />
                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">
                    Description
                  </Text>
                  <Text size="2">{request.description}</Text>
                </Flex>
              </>
            )}

            {request.rejectionReason && (
              <>
                <Separator size="4" />
                <Callout.Root color="red">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    <Text weight="medium">Rejection Reason: </Text>
                    {request.rejectionReason}
                  </Callout.Text>
                </Callout.Root>
              </>
            )}

            {request.respondedAt && (
              <>
                <Separator size="4" />
                <Flex justify="between" wrap="wrap" gap="2">
                  <Text size="2" color="gray">
                    Responded At
                  </Text>
                  <Flex direction="column" align="end" gap="1">
                    <Text size="2">{formatDate(request.respondedAt)}</Text>
                    {request.respondedByName && (
                      <Text size="1" color="gray">
                        by {request.respondedByName}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
      </Card>

      {/* Approval Section - only for pending requests */}
      {isPending && (
        <Card size="3">
          <Flex direction="column" gap="4">
            <Heading size="4">Review Request</Heading>

            {request.hasPendingFile ? (
              <Text size="2" color="gray">
                Review the uploaded file and approve or reject this request.
                Approved files will be available to all users.
              </Text>
            ) : (
              <Callout.Root color="orange">
                <Callout.Icon>
                  <ExclamationTriangleIcon />
                </Callout.Icon>
                <Callout.Text>
                  No file is associated with this request. It cannot be
                  approved.
                </Callout.Text>
              </Callout.Root>
            )}

            {/* Action Buttons */}
            <Flex gap="3" justify="end">
              <Dialog.Root
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
              >
                <Dialog.Trigger>
                  <Button variant="soft" color="red" disabled={loading}>
                    <CrossCircledIcon />
                    Reject
                  </Button>
                </Dialog.Trigger>
                <Dialog.Content maxWidth="450px">
                  <Dialog.Title>Reject Request</Dialog.Title>
                  <Dialog.Description size="2" color="gray">
                    Please provide a reason for rejecting this upload request.
                    The uploaded file will be deleted.
                  </Dialog.Description>
                  <Flex direction="column" gap="3" mt="4">
                    <TextArea
                      placeholder="Enter rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <Flex gap="3" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button
                        color="red"
                        onClick={handleReject}
                        disabled={loading}
                      >
                        {loading ? "Rejecting..." : "Reject Request"}
                      </Button>
                    </Flex>
                  </Flex>
                </Dialog.Content>
              </Dialog.Root>

              <Button
                onClick={handleApprove}
                disabled={loading || !request.hasPendingFile}
              >
                <CheckCircledIcon />
                {loading ? "Approving..." : "Approve Request"}
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Link to file if approved */}
      {request.fileId && (
        <Card size="2">
          <Flex align="center" justify="between">
            <Flex align="center" gap="2">
              <CheckCircledIcon width={18} height={18} color="var(--green-9)" />
              <Text size="2">This request has been approved.</Text>
            </Flex>
            <Button asChild variant="soft" size="1">
              <Link href={`/admin/files/${request.fileId}`}>View File</Link>
            </Button>
          </Flex>
        </Card>
      )}
    </AdminPageLayout>
  );
}
