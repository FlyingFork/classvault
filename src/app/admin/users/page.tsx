import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";
import UsersListClient from "./UsersListClient";

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

type SearchBy = "email" | "username";
type SortBy = "email" | "username" | "createdAt";
type SortOrder = "desc" | "asc";

export default async function UsersPage({ searchParams }: PageProps) {
  // Server-side authentication check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect if not authenticated or not an admin
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Extract and parse search params with defaults
  const resolvedSearchParams = (await searchParams) || {};
  const searchBy = (resolvedSearchParams.searchBy as SearchBy) || "email";
  const searchValue = (resolvedSearchParams.searchValue as string) || "";
  const sortBy = (resolvedSearchParams.sortBy as SortBy) || "createdAt";
  const sortOrder = (resolvedSearchParams.sortOrder as SortOrder) || "desc";
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = Number(resolvedSearchParams.limit) || 10;

  // Map UI values to API parameters
  const searchField = searchBy === "username" ? "name" : "email";
  const sortByField = sortBy === "username" ? "name" : sortBy;
  const offset = limit * (page - 1);

  // Fetch users from Better Auth API
  const result = await auth.api.listUsers({
    query: {
      searchValue,
      searchField,
      searchOperator: "contains",
      limit,
      offset,
      sortBy: sortByField,
      sortDirection: sortOrder,
    },
    headers: await headers(),
  });

  const users = result?.users || [];
  const total = result?.total || 0;

  // Get stats
  const [totalUsers, adminCount, bannedCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { banned: true } }),
  ]);

  const stats = {
    totalUsers,
    adminCount,
    bannedCount,
  };

  return (
    <UsersListClient
      users={users}
      total={total}
      stats={stats}
      initialSearchBy={searchBy}
      initialSearchValue={searchValue}
      initialSortBy={sortBy}
      initialSortOrder={sortOrder}
      initialPage={page}
      initialLimit={limit}
    />
  );
}
