"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Flex,
  Heading,
  Button,
  Text,
  Badge,
  DropdownMenu,
  IconButton,
  Switch,
} from "@radix-ui/themes";
import {
  PlusIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
  ArchiveIcon,
  ReaderIcon,
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
import { toggleClassActiveAction } from "./actions";

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  allowedFileTypes: string[];
  isActive: boolean;
  createdAt: string;
  fileCount: number;
  createdByName: string;
}

interface ClassesListClientProps {
  classes: ClassData[];
}

export function ClassesListClient({ classes }: ClassesListClientProps) {
  const router = useRouter();
  const [showInactive, setShowInactive] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchValue.toLowerCase());
      const matchesActive = showInactive || c.isActive;
      return matchesSearch && matchesActive;
    });
  }, [classes, searchValue, showInactive]);

  const handleToggleActive = async (classId: string, isActive: boolean) => {
    setLoading(classId);
    const result = await toggleClassActiveAction(classId, isActive);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isActive ? "Class restored" : "Class archived");
      router.refresh();
    }
  };

  const columns: Column<ClassData>[] = [
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <Flex direction="column" gap="1">
          <Text weight="medium">{item.name}</Text>
          {item.description && (
            <Text size="1" color="gray" style={{ maxWidth: 200 }} truncate>
              {item.description}
            </Text>
          )}
        </Flex>
      ),
    },
    {
      key: "fileTypes",
      header: "File Types",
      render: (item) => (
        <Flex gap="1" wrap="wrap">
          {item.allowedFileTypes.length > 0 ? (
            item.allowedFileTypes.map((type) => (
              <Badge key={type} size="1" variant="soft">
                {type.toUpperCase()}
              </Badge>
            ))
          ) : (
            <Text size="1" color="gray">
              All types
            </Text>
          )}
        </Flex>
      ),
    },
    {
      key: "files",
      header: "Files",
      width: "80px",
      render: (item) => (
        <Text size="2" color={item.fileCount > 0 ? undefined : "gray"}>
          {item.fileCount}
        </Text>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (item) => (
        <StatusBadge status={item.isActive ? "active" : "inactive"} />
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
              <Link href={`/admin/classes/${item.id}`}>
                <Pencil1Icon />
                Edit
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              color={item.isActive ? "red" : "green"}
              onClick={() => handleToggleActive(item.id, !item.isActive)}
            >
              <ArchiveIcon />
              {item.isActive ? "Archive" : "Restore"}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      ),
    },
  ];

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/classes", name: "Classes" },
      ]}
    >
      <Flex justify="between" align="center" wrap="wrap" gap="3">
        <Heading size="6">Classes</Heading>
        <Button asChild>
          <Link href="/admin/classes/new">
            <PlusIcon />
            New Class
          </Link>
        </Button>
      </Flex>

      <Card size="2">
        <Flex align="center" gap="2" mb="4">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          <Text size="2">Show archived classes</Text>
        </Flex>
      </Card>

      <DataTable
        data={filteredClasses}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search classes..."
        emptyState={
          <EmptyState
            icon={<ReaderIcon width={32} height={32} />}
            title="No classes found"
            description={
              searchValue
                ? "Try adjusting your search"
                : "Create your first class to get started"
            }
            actionLabel="New Class"
            actionHref="/admin/classes/new"
          />
        }
      />
    </AdminPageLayout>
  );
}
