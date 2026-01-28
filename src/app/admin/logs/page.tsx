import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { getMostAccessedFiles } from "@/lib/database";
import { LogsListClient } from "./LogsListClient";

interface PageProps {
  searchParams: Promise<{ fileId?: string; userId?: string }>;
}

export default async function LogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Build where clause based on filters
  const where: Record<string, string> = {};
  if (params.fileId) where.fileId = params.fileId;
  if (params.userId) where.userId = params.userId;

  // Get access logs with pagination
  const logs = await prisma.fileAccessLog.findMany({
    where,
    include: {
      file: {
        select: { id: true, originalFileName: true, classId: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { accessedAt: "desc" },
    take: 100,
  });

  // Get most accessed files for analytics
  const mostAccessed = await getMostAccessedFiles(10, 30);

  // Get unique files and users for filters
  const files = await prisma.file.findMany({
    select: { id: true, originalFileName: true },
    orderBy: { originalFileName: "asc" },
    take: 100,
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const logsData = logs.map((log) => ({
    id: log.id,
    accessedAt: log.accessedAt.toISOString(),
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    fileId: log.fileId,
    fileName: log.file?.originalFileName || "Unknown",
    userId: log.userId,
    userName: log.user?.name || "Unknown",
    userEmail: log.user?.email || "",
  }));

  const filesData = files.map((f) => ({
    id: f.id,
    name: f.originalFileName,
  }));

  const usersData = users.map((u) => ({
    id: u.id,
    name: u.name || u.email || "Unknown",
  }));

  return (
    <LogsListClient
      logs={logsData}
      mostAccessed={mostAccessed}
      files={filesData}
      users={usersData}
      initialFileFilter={params.fileId}
      initialUserFilter={params.userId}
    />
  );
}
