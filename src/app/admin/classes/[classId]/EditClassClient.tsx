"use client";

import { useState } from "react";
import {
  Card,
  Flex,
  Heading,
  Button,
  Text,
  TextField,
  TextArea,
  Badge,
  Table,
} from "@radix-ui/themes";
import { FileTextIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AdminPageLayout,
  FileTypeCheckboxGrid,
  StatusBadge,
  EmptyState,
} from "@/app/components/admin";
import { updateClassAction, toggleClassActiveAction } from "../actions";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  allowedFileTypes: string[];
  isActive: boolean;
  createdAt: string;
}

interface FileData {
  id: string;
  originalFileName: string;
  version: number;
  isApproved: boolean;
  isDeleted: boolean;
  uploadedAt: string;
  uploadedByName: string;
}

interface EditClassClientProps {
  classData: ClassData;
  files: FileData[];
}

export function EditClassClient({ classData, files }: EditClassClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(classData.name);
  const [description, setDescription] = useState(classData.description || "");
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>(
    classData.allowedFileTypes,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Class name is required");
      return;
    }

    setLoading(true);
    const result = await updateClassAction(classData.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      allowedFileTypes,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Class updated successfully");
      router.refresh();
    }
  };

  const handleToggleActive = async () => {
    setLoading(true);
    const result = await toggleClassActiveAction(
      classData.id,
      !classData.isActive,
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(classData.isActive ? "Class archived" : "Class restored");
      router.refresh();
    }
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/classes", name: "Classes" },
        { url: `/admin/classes/${classData.id}`, name: classData.name },
      ]}
      maxWidth="900px"
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Flex align="center" gap="3">
          <Heading size="6">{classData.name}</Heading>
          <StatusBadge
            status={classData.isActive ? "active" : "inactive"}
            size="2"
          />
        </Flex>
      </Flex>

      <Card size="3">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="5">
            <Heading size="4">Class Details</Heading>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                Class Name *
              </Text>
              <TextField.Root
                placeholder="e.g., Mathematics, Advanced Physics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                Description
              </Text>
              <TextArea
                placeholder="Optional description for this class..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text as="label" size="2" weight="medium">
                Allowed File Types
              </Text>
              <FileTypeCheckboxGrid
                value={allowedFileTypes}
                onChange={setAllowedFileTypes}
                disabled={loading}
              />
            </Flex>

            <Flex gap="3" justify="end" mt="2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>

      <Card size="3">
        <Flex direction="column" gap="4">
          <Heading size="4">Class Status</Heading>
          <Flex align="center" justify="between">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">
                {classData.isActive ? "Archive Class" : "Restore Class"}
              </Text>
              <Text size="1" color="gray">
                {classData.isActive
                  ? "Archived classes are hidden from users but files are preserved"
                  : "Restore this class to make it visible to users again"}
              </Text>
            </Flex>
            <Button
              variant="soft"
              color={classData.isActive ? "red" : "green"}
              onClick={handleToggleActive}
              disabled={loading}
            >
              {classData.isActive ? "Archive" : "Restore"}
            </Button>
          </Flex>
        </Flex>
      </Card>

      <Card size="3">
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Heading size="4">Files in Class</Heading>
            <Button asChild variant="soft" size="1">
              <Link href={`/admin/files?classId=${classData.id}`}>
                View All
              </Link>
            </Button>
          </Flex>

          {files.length === 0 ? (
            <EmptyState
              icon={<FileTextIcon width={32} height={32} />}
              title="No files yet"
              description="Files uploaded to this class will appear here"
            />
          ) : (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>File Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Version</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Uploaded By</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {files.map((file) => (
                  <Table.Row key={file.id}>
                    <Table.Cell>
                      <Link
                        href={`/admin/files/${file.id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <Text color="violet">{file.originalFileName}</Text>
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="soft">v{file.version}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {file.isDeleted ? (
                        <StatusBadge status="inactive" />
                      ) : file.isApproved ? (
                        <StatusBadge status="approved" />
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {file.uploadedByName}
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
