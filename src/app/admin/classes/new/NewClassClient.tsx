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
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageLayout, FileTypeCheckboxGrid } from "@/app/components/admin";
import { createClassAction } from "../actions";

export function NewClassClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowedFileTypes, setAllowedFileTypes] = useState<string[]>([
    "pdf",
    "docx",
    "xlsx",
    "md",
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Class name is required");
      return;
    }

    setLoading(true);
    const result = await createClassAction({
      name: name.trim(),
      description: description.trim() || undefined,
      allowedFileTypes,
    });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Class created successfully");
      router.push("/admin/classes");
    }
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/classes", name: "Classes" },
        { url: "/admin/classes/new", name: "New Class" },
      ]}
      maxWidth="700px"
    >
      <Heading size="6">Create New Class</Heading>

      <Card size="3">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="5">
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
              <Text size="1" color="gray">
                Select which file types can be uploaded to this class
              </Text>
              <FileTypeCheckboxGrid
                value={allowedFileTypes}
                onChange={setAllowedFileTypes}
                disabled={loading}
              />
            </Flex>

            <Flex gap="3" justify="end" mt="2">
              <Button
                type="button"
                variant="soft"
                color="gray"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Class"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </AdminPageLayout>
  );
}
