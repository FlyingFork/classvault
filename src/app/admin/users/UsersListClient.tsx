"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Flex,
  Text,
  Select,
  TextField,
  SegmentedControl,
  Grid,
  Separator,
  Table,
  Button,
  IconButton,
  Avatar,
  DropdownMenu,
  Badge,
  Heading,
} from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  DotsHorizontalIcon,
  PersonIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { UserWithRole } from "better-auth/plugins";
import { AdminPageLayout, StatCard, EmptyState } from "@/app/components/admin";

type SearchBy = "email" | "username";
type SortBy = "email" | "username" | "createdAt";
type SortOrder = "desc" | "asc";

interface Stats {
  totalUsers: number;
  adminCount: number;
  bannedCount: number;
}

interface UsersListClientProps {
  users: UserWithRole[];
  total: number;
  stats: Stats;
  initialSearchBy: SearchBy;
  initialSearchValue: string;
  initialSortBy: SortBy;
  initialSortOrder: SortOrder;
  initialPage: number;
  initialLimit: number;
}

export default function UsersListClient({
  users,
  total,
  stats,
  initialSearchBy,
  initialSearchValue,
  initialSortBy,
  initialSortOrder,
  initialPage,
  initialLimit,
}: UsersListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state initialized from props
  const [searchBy, setSearchBy] = useState<SearchBy>(initialSearchBy);
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [debouncedSearchValue, setDebouncedSearchValue] =
    useState(initialSearchValue);
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Debounce search value (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update URL when filters change (after debounce for search)
  useEffect(() => {
    const params = new URLSearchParams();

    // Reset to page 1 if filters changed (not just page navigation)
    const filtersChanged =
      searchBy !== initialSearchBy ||
      debouncedSearchValue !== initialSearchValue ||
      sortBy !== initialSortBy ||
      sortOrder !== initialSortOrder ||
      limit !== initialLimit;

    const effectivePage = filtersChanged ? 1 : currentPage;

    // Only add params if they differ from defaults
    if (searchBy !== "email") params.set("searchBy", searchBy);
    if (debouncedSearchValue) params.set("searchValue", debouncedSearchValue);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (effectivePage !== 1) params.set("page", effectivePage.toString());
    if (limit !== 10) params.set("limit", limit.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/admin/users?${queryString}` : "/admin/users";

    startTransition(() => {
      router.push(newUrl);
    });
  }, [
    searchBy,
    debouncedSearchValue,
    sortBy,
    sortOrder,
    currentPage,
    limit,
    router,
    initialSearchBy,
    initialSearchValue,
    initialSortBy,
    initialSortOrder,
    initialLimit,
  ]);

  // Generate page numbers to display (show 5 pages centered around current page)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/admin", name: "Admin" },
        { url: "/admin/users", name: "Users" },
      ]}
    >
      <Heading size="6">Users</Heading>

      {/* Stats */}
      <Grid columns={{ initial: "3" }} gap="4">
        <StatCard
          icon={<PersonIcon width={20} height={20} />}
          label="Total Users"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={<LockClosedIcon width={20} height={20} />}
          label="Admins"
          value={stats.adminCount}
          color="violet"
        />
        <StatCard
          icon={<ExclamationTriangleIcon width={20} height={20} />}
          label="Banned"
          value={stats.bannedCount}
          color={stats.bannedCount > 0 ? "red" : "gray"}
        />
      </Grid>

      <Card size="2">
        <Flex direction="column" gap="4">
          {/* Search and Sort Controls */}
          <Flex
            gap="4"
            direction={{ initial: "column", sm: "row" }}
            wrap="wrap"
          >
            <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 200 }}>
              <Text size="2" weight="medium">
                Search
              </Text>
              <Flex gap="2">
                <Select.Root
                  value={searchBy}
                  onValueChange={(value) => setSearchBy(value as SearchBy)}
                >
                  <Select.Trigger style={{ minWidth: 100 }} />
                  <Select.Content>
                    <Select.Item value="email">Email</Select.Item>
                    <Select.Item value="username">Username</Select.Item>
                  </Select.Content>
                </Select.Root>
                <TextField.Root
                  placeholder={`Search by ${searchBy}...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <TextField.Slot>
                    <MagnifyingGlassIcon height="16" width="16" />
                  </TextField.Slot>
                </TextField.Root>
              </Flex>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Sort By
              </Text>
              <Flex gap="2">
                <Select.Root
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortBy)}
                >
                  <Select.Trigger style={{ minWidth: 120 }} />
                  <Select.Content>
                    <Select.Item value="email">Email</Select.Item>
                    <Select.Item value="username">Username</Select.Item>
                    <Select.Item value="createdAt">Created At</Select.Item>
                  </Select.Content>
                </Select.Root>
                <SegmentedControl.Root
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as SortOrder)}
                  size="2"
                >
                  <SegmentedControl.Item value="desc">
                    Desc
                  </SegmentedControl.Item>
                  <SegmentedControl.Item value="asc">Asc</SegmentedControl.Item>
                </SegmentedControl.Root>
              </Flex>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Per Page
              </Text>
              <Select.Root
                value={limit.toString()}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <Select.Trigger style={{ minWidth: 80 }} />
                <Select.Content>
                  <Select.Item value="10">10</Select.Item>
                  <Select.Item value="25">25</Select.Item>
                  <Select.Item value="50">50</Select.Item>
                  <Select.Item value="100">100</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>

          <Separator size="4" />

          {/* User List */}
          <Flex direction="column" gap="2">
            <Flex justify="between" align="center">
              <Text size="2" color="gray">
                Showing {users.length} of {total} users
              </Text>
              {isPending && (
                <Text size="1" color="gray">
                  Loading...
                </Text>
              )}
            </Flex>

            {users.length === 0 ? (
              <EmptyState
                icon={<PersonIcon width={32} height={32} />}
                title="No users found"
                description="Try adjusting your search criteria"
              />
            ) : (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell width="50px">
                      Avatar
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="100px">
                      Role
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="100px">
                      Status
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell width="50px">
                      Actions
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {users.map((user) => (
                    <Table.Row key={user.id} align="center">
                      <Table.RowHeaderCell>
                        <Avatar
                          size="2"
                          fallback={
                            user.name?.charAt(0) || user.email.charAt(0)
                          }
                          radius="full"
                        />
                      </Table.RowHeaderCell>
                      <Table.Cell>
                        <Text size="2">{user.email}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="2">{user.name || "—"}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={user.role === "admin" ? "violet" : "gray"}
                          variant="soft"
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        {user.banned ? (
                          <Badge color="red" variant="soft">
                            Banned
                          </Badge>
                        ) : (
                          <Badge color="green" variant="soft">
                            Active
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            <IconButton variant="ghost" size="1">
                              <DotsHorizontalIcon />
                            </IconButton>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content size="1">
                            <DropdownMenu.Item asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                Edit User
                              </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild>
                              <Link href={`/admin/logs?userId=${user.id}`}>
                                View Activity
                              </Link>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Flex>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <Separator size="4" />
              <Flex gap="2" align="center" justify="center" wrap="wrap">
                <IconButton
                  variant="soft"
                  size="1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  aria-label="First page"
                >
                  <DoubleArrowLeftIcon />
                </IconButton>

                <IconButton
                  variant="soft"
                  size="1"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon />
                </IconButton>

                <Flex gap="1" wrap="wrap" justify="center">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      size="1"
                      variant={currentPage === page ? "solid" : "soft"}
                      onClick={() => setCurrentPage(page)}
                      style={{ minWidth: 32 }}
                    >
                      {page}
                    </Button>
                  ))}
                </Flex>

                <IconButton
                  variant="soft"
                  size="1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </IconButton>

                <IconButton
                  variant="soft"
                  size="1"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  aria-label="Last page"
                >
                  <DoubleArrowRightIcon />
                </IconButton>
              </Flex>
            </>
          )}
        </Flex>
      </Card>
    </AdminPageLayout>
  );
}
