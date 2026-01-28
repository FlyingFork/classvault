"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Flex,
  Box,
  Heading,
  Text,
  Badge,
  Button,
  Card,
  Select,
  Separator,
  Callout,
} from "@radix-ui/themes";
import {
  DownloadIcon,
  FileTextIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { toast } from "sonner";
import {
  MarkdownViewer,
  InlineTableOfContents,
  MobileTOCTrigger,
  extractHeadings,
  scrollToHeading,
  useActiveHeading,
} from "@/app/components/markdown";
import { UpdateRequestDialog } from "./UpdateRequestDialog";

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
  uploadedAt: string;
  approvedAt: string | null;
  classId: string;
  className: string;
  uploadedByName: string;
}

interface VersionData {
  id: string;
  version: number;
  isCurrentVersion: boolean;
  isDeleted: boolean;
  uploadedAt: string;
}

interface FileViewClientProps {
  file: FileData;
  versions: VersionData[];
  isAdmin: boolean;
  isUploader: boolean;
  isAuthenticated: boolean;
  isMarkdown: boolean;
  markdownContent: string | null;
  fileExistsOnDisk: boolean;
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
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FileViewClient({
  file,
  versions,
  isAdmin,
  isUploader,
  isMarkdown,
  markdownContent,
  fileExistsOnDisk,
}: FileViewClientProps) {
  const router = useRouter();
  const [selectedVersionId, setSelectedVersionId] = useState(file.id);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Extract headings from markdown for TOC
  const headings = useMemo(
    () => (markdownContent ? extractHeadings(markdownContent) : []),
    [markdownContent],
  );

  // Track active heading for TOC highlighting
  const { activeId } = useActiveHeading(headings);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle TOC item click
  const handleTocClick = useCallback((id: string) => {
    scrollToHeading(id);
  }, []);

  // Uploader can request updates on approved, current, non-deleted files
  const canRequestUpdate =
    isUploader &&
    file.isApproved &&
    file.isCurrentVersion &&
    !file.isDeleted &&
    fileExistsOnDisk;

  const hasToc = isMarkdown && markdownContent && headings.length > 0;

  // Toast callbacks for copy actions
  const handleCopySuccess = useCallback(() => {
    toast.success("Link copied to clipboard");
  }, []);

  const handleCopyError = useCallback(() => {
    toast.error("Failed to copy link");
  }, []);

  const handleVersionChange = (versionId: string) => {
    setSelectedVersionId(versionId);
    router.push(`/file/${versionId}`);
  };

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="4">
        {/* Back link for navigation */}
        <Box>
          <Link
            href={`/browse/${file.classId}`}
            style={{ textDecoration: "none", color: "var(--accent-11)" }}
          >
            <Text size="2">← Back</Text>
          </Link>
        </Box>

        {/* Header */}
        <Flex
          justify="between"
          align={{ initial: "start", sm: "center" }}
          wrap="wrap"
          gap="3"
          direction={{ initial: "column", sm: "row" }}
        >
          <Flex align="center" gap="2" wrap="wrap">
            <FileTextIcon width={24} height={24} />
            <Heading size="5">{file.originalFileName}</Heading>
            <Badge variant="soft">v{file.version}</Badge>
            {file.isApproved && !file.isDeleted && (
              <Badge color="green" variant="soft">
                Approved
              </Badge>
            )}
            {file.isDeleted && (
              <Badge color="red" variant="soft">
                Deleted
              </Badge>
            )}
            {!file.isApproved && !file.isDeleted && (
              <Badge color="yellow" variant="soft">
                Pending
              </Badge>
            )}
            {file.isCurrentVersion && (
              <Badge color="blue" variant="soft">
                Current
              </Badge>
            )}
          </Flex>

          <Flex gap="2" align="center" wrap="wrap">
            {/* Version selector for admins */}
            {isAdmin && versions.length > 1 && (
              <Select.Root
                value={selectedVersionId}
                onValueChange={handleVersionChange}
              >
                <Select.Trigger placeholder="Select version" />
                <Select.Content>
                  {versions.map((v) => (
                    <Select.Item key={v.id} value={v.id}>
                      v{v.version}
                      {v.isCurrentVersion && " (Current)"}
                      {v.isDeleted && " (Deleted)"}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            )}

            {/* Update button for uploaders */}
            {canRequestUpdate && (
              <Button
                variant="soft"
                color="violet"
                onClick={() => setShowUpdateDialog(true)}
              >
                <UpdateIcon />
                Request Update
              </Button>
            )}

            {/* Download button */}
            {fileExistsOnDisk ? (
              <Button asChild>
                <a href={`/api/files/${file.id}/download`} download>
                  <DownloadIcon />
                  Download
                </a>
              </Button>
            ) : (
              <Button disabled>
                <DownloadIcon />
                File Unavailable
              </Button>
            )}
          </Flex>
        </Flex>

        {/* Status warnings for admins */}
        {isAdmin && file.isDeleted && (
          <Callout.Root color="red">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
              This file version has been deleted and is not visible to regular
              users.
            </Callout.Text>
          </Callout.Root>
        )}

        {isAdmin && !file.isApproved && (
          <Callout.Root color="yellow">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              This file is pending approval and is not visible to regular users.
            </Callout.Text>
          </Callout.Root>
        )}

        {!fileExistsOnDisk && (
          <Callout.Root color="red">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
              The file is no longer available on disk. Please contact an
              administrator.
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Metadata card */}
        <Card variant="surface">
          <Flex
            gap="4"
            wrap="wrap"
            direction={{ initial: "column", sm: "row" }}
            p="3"
          >
            <Flex direction="column" gap="1" style={{ minWidth: 120 }}>
              <Text size="1" color="gray" weight="medium">
                Class
              </Text>
              <Badge variant="soft" color="violet">
                {file.className}
              </Badge>
            </Flex>

            <Separator orientation="vertical" style={{ display: "none" }} />

            <Flex direction="column" gap="1" style={{ minWidth: 80 }}>
              <Text size="1" color="gray" weight="medium">
                Size
              </Text>
              <Text size="2">{formatFileSize(file.size)}</Text>
            </Flex>

            <Flex direction="column" gap="1" style={{ minWidth: 80 }}>
              <Text size="1" color="gray" weight="medium">
                Type
              </Text>
              <Text size="2">{file.fileType}</Text>
            </Flex>

            <Flex direction="column" gap="1" style={{ minWidth: 120 }}>
              <Text size="1" color="gray" weight="medium">
                Uploaded By
              </Text>
              <Text size="2">{file.uploadedByName}</Text>
            </Flex>

            <Flex direction="column" gap="1" style={{ minWidth: 150 }}>
              <Text size="1" color="gray" weight="medium">
                Uploaded
              </Text>
              <Text size="2">{formatDate(file.uploadedAt)}</Text>
            </Flex>

            {file.approvedAt && (
              <Flex direction="column" gap="1" style={{ minWidth: 150 }}>
                <Text size="1" color="gray" weight="medium">
                  Approved
                </Text>
                <Text size="2">{formatDate(file.approvedAt)}</Text>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Description if present */}
        {file.description && (
          <Card variant="surface">
            <Flex direction="column" gap="2" p="3">
              <Text size="2" color="gray" weight="medium">
                Description
              </Text>
              <Text size="2">{file.description}</Text>
            </Flex>
          </Card>
        )}

        {/* Content area */}
        {isMarkdown ? (
          <>
            {/* Desktop TOC - inline between metadata and content */}
            {hasToc && !isMobile && (
              <InlineTableOfContents
                headings={headings}
                activeId={activeId}
                onItemClick={handleTocClick}
              />
            )}

            {/* Main content card */}
            <Card>
              <Box p="4">
                {markdownContent ? (
                  <MarkdownViewer
                    content={markdownContent}
                    onCopySuccess={handleCopySuccess}
                    onCopyError={handleCopyError}
                  />
                ) : (
                  <Flex direction="column" align="center" gap="3" py="6">
                    <ExclamationTriangleIcon
                      width={32}
                      height={32}
                      color="var(--gray-9)"
                    />
                    <Heading size="4" color="gray">
                      Unable to Load Content
                    </Heading>
                    <Text size="2" color="gray">
                      The markdown content could not be loaded. Try downloading
                      the file instead.
                    </Text>
                  </Flex>
                )}
              </Box>
            </Card>

            {/* Mobile TOC Trigger */}
            {hasToc && isMobile && (
              <MobileTOCTrigger
                headings={headings}
                activeId={activeId}
                onItemClick={handleTocClick}
              />
            )}
          </>
        ) : (
          <Card>
            <Flex direction="column" align="center" gap="4" py="8">
              <FileTextIcon width={48} height={48} color="var(--gray-9)" />
              <Heading size="4" color="gray">
                Preview Not Available
              </Heading>
              <Text size="2" color="gray" align="center">
                This file type cannot be previewed in the browser.
                {fileExistsOnDisk &&
                  " Click the download button to access the file."}
              </Text>
              {fileExistsOnDisk && (
                <Button asChild size="3">
                  <a href={`/api/files/${file.id}/download`} download>
                    <DownloadIcon />
                    Download File
                  </a>
                </Button>
              )}
            </Flex>
          </Card>
        )}
      </Flex>

      {/* Update Request Dialog for uploaders */}
      {canRequestUpdate && (
        <UpdateRequestDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          fileId={file.id}
          fileName={file.originalFileName}
          classId={file.classId}
          className={file.className}
        />
      )}
    </Container>
  );
}
