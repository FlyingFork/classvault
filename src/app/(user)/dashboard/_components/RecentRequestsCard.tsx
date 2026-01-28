"use client";

import { Fragment, useState } from "react";
import {
  Card,
  Flex,
  Heading,
  Separator,
  Text,
  Button,
  AlertDialog,
} from "@radix-ui/themes";
import Link from "next/link";
import { FileTextIcon, Cross2Icon, DownloadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EmptyState, StatusBadge } from "@/app/components/admin";
import { cancelUploadRequest } from "../actions";

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

interface RecentRequestsCardProps {
  requests: RecentRequest[];
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0 || Number.isNaN(bytes)) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function RecentRequestsCard({ requests }: RecentRequestsCardProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (requestId: string) => {
    setCancellingId(requestId);
    try {
      const result = await cancelUploadRequest(requestId);
      if (result.success) {
        toast.success("Request cancelled");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Card size="2" id="recent-requests">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="center">
          <Heading size="4">Recent Requests</Heading>
          <Text asChild size="2" color="violet">
            <Link href="/dashboard/requests">View all</Link>
          </Text>
        </Flex>

        {requests.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon width={28} height={28} />}
            title="No requests yet"
            description="Your upload requests will appear here once submitted."
          />
        ) : (
          <Flex direction="column" gap="3">
            {requests.map((request, index) => (
              <Fragment key={request.id}>
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="start" gap="3">
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text size="3" weight="medium">
                        {request.fileName}
                      </Text>
                      <Text size="2" color="gray">
                        {request.className}
                      </Text>
                    </Flex>
                    <StatusBadge status={request.status} />
                  </Flex>

                  <Text size="1" color="gray">
                    Requested {formatDate(request.requestedAt)} •{" "}
                    {formatFileSize(request.size)}
                  </Text>

                  {request.status !== "pending" && request.respondedAt && (
                    <Text size="1" color="gray">
                      {request.status === "approved" ? "Approved" : "Reviewed"}{" "}
                      on {formatDate(request.respondedAt)}
                      {request.respondedByName
                        ? ` by ${request.respondedByName}`
                        : ""}
                    </Text>
                  )}

                  {request.status === "rejected" && request.rejectionReason && (
                    <Text size="1" color="red">
                      Reason: {request.rejectionReason}
                    </Text>
                  )}

                  {/* Action buttons */}
                  <Flex gap="2" mt="1">
                    {/* Pending: show download pending file and cancel */}
                    {request.status === "pending" && (
                      <>
                        <Button asChild variant="soft" size="1" color="gray">
                          <a
                            href={`/api/requests/${request.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <DownloadIcon width={12} height={12} />
                            Download
                          </a>
                        </Button>
                        <AlertDialog.Root>
                          <AlertDialog.Trigger>
                            <Button
                              variant="soft"
                              size="1"
                              color="red"
                              disabled={cancellingId === request.id}
                            >
                              <Cross2Icon width={12} height={12} />
                              {cancellingId === request.id
                                ? "Cancelling..."
                                : "Cancel"}
                            </Button>
                          </AlertDialog.Trigger>
                          <AlertDialog.Content maxWidth="400px">
                            <AlertDialog.Title>
                              Cancel Upload Request
                            </AlertDialog.Title>
                            <AlertDialog.Description size="2">
                              Are you sure you want to cancel this upload
                              request? The uploaded file will be deleted.
                            </AlertDialog.Description>
                            <Flex gap="3" mt="4" justify="end">
                              <AlertDialog.Cancel>
                                <Button variant="soft" color="gray">
                                  Keep Request
                                </Button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action>
                                <Button
                                  color="red"
                                  onClick={() => handleCancel(request.id)}
                                >
                                  Cancel Request
                                </Button>
                              </AlertDialog.Action>
                            </Flex>
                          </AlertDialog.Content>
                        </AlertDialog.Root>
                      </>
                    )}

                    {/* Approved: show download approved file */}
                    {request.status === "approved" && request.fileId && (
                      <Button asChild variant="soft" size="1" color="green">
                        <a
                          href={`/api/files/${request.fileId}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <DownloadIcon width={12} height={12} />
                          Download
                        </a>
                      </Button>
                    )}
                  </Flex>
                </Flex>
                {index < requests.length - 1 && <Separator size="4" />}
              </Fragment>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
