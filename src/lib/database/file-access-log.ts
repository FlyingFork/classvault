import { prisma } from "@/prisma";
import type { FileAccessLog } from "@/generated/prisma/client";
import type { PaginationParams } from "./class";

// ============================================================================
// Types
// ============================================================================

export type LogFileAccessInput = {
  fileId: string;
  userId?: string; // Optional to support anonymous/unauthenticated access
  ipAddress?: string;
  userAgent?: string;
};

export type MostAccessedFile = {
  fileId: string;
  fileName: string;
  classId: string;
  className: string;
  accessCount: number;
};

// Common includes for access log queries
const accessLogIncludes = {
  file: {
    select: {
      id: true,
      originalFileName: true,
      classId: true,
      class: { select: { id: true, name: true } },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
};

// ============================================================================
// FileAccessLog Methods
// ============================================================================

/**
 * Log a file access (immutable audit entry)
 */
export async function logFileAccess(
  data: LogFileAccessInput,
): Promise<FileAccessLog> {
  return prisma.fileAccessLog.create({
    data: {
      fileId: data.fileId,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    include: accessLogIncludes,
  });
}

/**
 * Get all access logs for a file
 */
export async function getFileAccessLogs(
  fileId: string,
  pagination?: PaginationParams,
): Promise<FileAccessLog[]> {
  return prisma.fileAccessLog.findMany({
    where: { fileId },
    include: accessLogIncludes,
    orderBy: { accessedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get all access logs for a user
 */
export async function getUserAccessLogs(
  userId: string,
  pagination?: PaginationParams,
): Promise<FileAccessLog[]> {
  return prisma.fileAccessLog.findMany({
    where: { userId },
    include: accessLogIncludes,
    orderBy: { accessedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get access logs within a date range
 */
export async function getAccessLogsByDateRange(
  startDate: Date,
  endDate: Date,
  pagination?: PaginationParams,
): Promise<FileAccessLog[]> {
  return prisma.fileAccessLog.findMany({
    where: {
      accessedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: accessLogIncludes,
    orderBy: { accessedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get the most accessed files (analytics)
 * @param limit Maximum number of files to return (default: 10)
 * @param days Number of days to look back (default: 30)
 */
export async function getMostAccessedFiles(
  limit: number = 10,
  days: number = 30,
): Promise<MostAccessedFile[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Group access logs by fileId and count
  const accessCounts = await prisma.fileAccessLog.groupBy({
    by: ["fileId"],
    where: {
      accessedAt: { gte: startDate },
    },
    _count: {
      fileId: true,
    },
    orderBy: {
      _count: {
        fileId: "desc",
      },
    },
    take: limit,
  });

  // Get file details for the top accessed files
  const fileIds = accessCounts.map((a) => a.fileId);
  const files = await prisma.file.findMany({
    where: { id: { in: fileIds } },
    include: {
      class: { select: { id: true, name: true } },
    },
  });

  // Create a map for quick lookup
  const fileMap = new Map(files.map((f) => [f.id, f]));

  // Combine counts with file details
  return accessCounts
    .map((a) => {
      const file = fileMap.get(a.fileId);
      if (!file) return null;

      return {
        fileId: file.id,
        fileName: file.originalFileName,
        classId: file.classId,
        className: file.class.name,
        accessCount: a._count.fileId,
      };
    })
    .filter((f): f is MostAccessedFile => f !== null);
}

/**
 * Count total access logs for a file
 */
export async function countFileAccesses(fileId: string): Promise<number> {
  return prisma.fileAccessLog.count({
    where: { fileId },
  });
}

/**
 * Count total access logs for a user
 */
export async function countUserAccesses(userId: string): Promise<number> {
  return prisma.fileAccessLog.count({
    where: { userId },
  });
}

/**
 * Get access logs for a specific file by a specific user
 */
export async function getFileAccessLogsByUser(
  fileId: string,
  userId: string,
  pagination?: PaginationParams,
): Promise<FileAccessLog[]> {
  return prisma.fileAccessLog.findMany({
    where: {
      fileId,
      userId,
    },
    include: accessLogIncludes,
    orderBy: { accessedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}
