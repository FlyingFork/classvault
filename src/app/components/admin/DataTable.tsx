"use client";

import {
  Flex,
  Table,
  TextField,
  Select,
  IconButton,
  Text,
  Card,
} from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
  width?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  // Sort
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOrder?: "asc" | "desc";
  onSortOrderChange?: (value: "asc" | "desc") => void;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Loading
  loading?: boolean;
  // Empty state
  emptyState?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  sortOptions,
  sortValue,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading = false,
  emptyState,
}: DataTableProps<T>) {
  const showSearch = onSearchChange !== undefined;
  const showSort = sortOptions && onSortChange;
  const showPagination = onPageChange && totalPages > 1;
  const showControls = showSearch || showSort;

  if (data.length === 0 && emptyState && !loading) {
    return <>{emptyState}</>;
  }

  return (
    <Card size="2">
      <Flex direction="column" gap="4">
        {showControls && (
          <Flex
            gap="3"
            wrap="wrap"
            direction={{ initial: "column", sm: "row" }}
          >
            {showSearch && (
              <TextField.Root
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon />
                </TextField.Slot>
              </TextField.Root>
            )}
            {showSort && (
              <Flex gap="2">
                <Select.Root value={sortValue} onValueChange={onSortChange}>
                  <Select.Trigger placeholder="Sort by" />
                  <Select.Content>
                    {sortOptions.map((opt) => (
                      <Select.Item key={opt.value} value={opt.value}>
                        {opt.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                {sortOrder && onSortOrderChange && (
                  <Select.Root
                    value={sortOrder}
                    onValueChange={onSortOrderChange}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="asc">Ascending</Select.Item>
                      <Select.Item value="desc">Descending</Select.Item>
                    </Select.Content>
                  </Select.Root>
                )}
              </Flex>
            )}
          </Flex>
        )}

        <Table.Root variant="surface" style={{ opacity: loading ? 0.5 : 1 }}>
          <Table.Header>
            <Table.Row>
              {columns.map((col) => (
                <Table.ColumnHeaderCell
                  key={col.key}
                  style={{ width: col.width }}
                >
                  {col.header}
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((item) => (
              <Table.Row key={keyExtractor(item)}>
                {columns.map((col) => (
                  <Table.Cell key={col.key}>{col.render(item)}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        {showPagination && (
          <Flex align="center" justify="center" gap="2">
            <IconButton
              variant="soft"
              size="1"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
            >
              <DoubleArrowLeftIcon />
            </IconButton>
            <IconButton
              variant="soft"
              size="1"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Text size="2" color="gray">
              Page {page} of {totalPages}
            </Text>
            <IconButton
              variant="soft"
              size="1"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
            <IconButton
              variant="soft"
              size="1"
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              <DoubleArrowRightIcon />
            </IconButton>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
