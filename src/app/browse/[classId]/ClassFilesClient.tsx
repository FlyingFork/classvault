"use client";

import Link from "next/link";
import {
  Container,
  Flex,
  Heading,
  Text,
  Card,
  Table,
  Badge,
  Button,
  Box,
} from "@radix-ui/themes";
import {
  FileTextIcon,
  DownloadIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

interface FileData {
  id: string;
  originalFileName: string;
  fileType: string;
  size: number;
  description: string | null;
  version: number;
  uploadedAt: string;
  uploadedByName: string;
}

interface ClassData {
  id: string;
  name: string;
  description: string | null;
}

interface ClassFilesClientProps {
  classData: ClassData;
  files: FileData[];
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

function getFileTypeIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("markdown") || fileType.includes("text/x-markdown"))
    return "📝";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("spreadsheet") || fileType.includes("xlsx"))
    return "📊";
  if (fileType.includes("document") || fileType.includes("docx")) return "📃";
  return "📁";
}

export function ClassFilesClient({ classData, files }: ClassFilesClientProps) {
  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="6">
        {/* Back link */}
        <Box>
          <Link
            href="/browse"
            style={{ textDecoration: "none", color: "var(--accent-11)" }}
          >
            <Flex align="center" gap="1">
              <ArrowLeftIcon />
              <Text size="2">Back to Classes</Text>
            </Flex>
          </Link>
        </Box>

        {/* Header */}
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <FileTextIcon width={28} height={28} />
            <Heading size="7">{classData.name}</Heading>
          </Flex>
          {classData.description && (
            <Text size="3" color="gray">
              {classData.description}
            </Text>
          )}
          <Text size="2" color="gray">
            {files.length} {files.length === 1 ? "file" : "files"} available
          </Text>
        </Flex>

        {/* Files List */}
        {files.length === 0 ? (
          <Card size="4">
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap="4"
              py="8"
            >
              <MagnifyingGlassIcon
                width={48}
                height={48}
                color="var(--gray-8)"
              />
              <Heading size="4" color="gray">
                No Files Available
              </Heading>
              <Text size="2" color="gray" align="center">
                There are no approved files in this class yet.
              </Text>
            </Flex>
          </Card>
        ) : (
          <Card size="3">
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>File</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Size</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Uploaded</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {files.map((file) => (
                  <Table.Row key={file.id}>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="2">
                          <Text size="2">{getFileTypeIcon(file.fileType)}</Text>
                          <Link
                            href={`/file/${file.id}`}
                            style={{
                              textDecoration: "none",
                              color: "var(--accent-11)",
                            }}
                          >
                            <Text size="2" weight="medium">
                              {file.originalFileName}
                            </Text>
                          </Link>
                          {file.version > 1 && (
                            <Badge size="1" variant="soft">
                              v{file.version}
                            </Badge>
                          )}
                        </Flex>
                        {file.description && (
                          <Text
                            size="1"
                            color="gray"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {file.description}
                          </Text>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {formatFileSize(file.size)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex direction="column" gap="1">
                        <Text size="2" color="gray">
                          {formatDate(file.uploadedAt)}
                        </Text>
                        <Text size="1" color="gray">
                          by {file.uploadedByName}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Button asChild size="1" variant="soft">
                          <Link href={`/file/${file.id}`}>View</Link>
                        </Button>
                        <Button asChild size="1" variant="soft" color="green">
                          <a href={`/api/files/${file.id}/download`} download>
                            <DownloadIcon />
                          </a>
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        )}
      </Flex>
    </Container>
  );
}
