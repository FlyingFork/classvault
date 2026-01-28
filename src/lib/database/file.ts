import { prisma } from "@/prisma";
import type { File } from "@/generated/prisma/client";
import type { PaginationParams } from "./class";

// ============================================================================
// Types
// ============================================================================

export type CreateFileInput = {
  classId: string;
  originalFileName: string;
  fileType: string;
  externalVpsId: string;
  externalVpsUrl: string;
  size: bigint;
  description?: string;
  uploadedById: string;
  isApproved?: boolean;
  approvedById?: string;
};

export type CreateFileVersionInput = Omit<
  CreateFileInput,
  "isApproved" | "approvedById"
> & {
  parentFileId: string;
};

// Common includes for file queries
const fileIncludes = {
  class: {
    select: { id: true, name: true, isActive: true },
  },
  uploadedBy: {
    select: { id: true, name: true, email: true },
  },
  approvedBy: {
    select: { id: true, name: true, email: true },
  },
  deletedBy: {
    select: { id: true, name: true, email: true },
  },
};

// ============================================================================
// File Methods
// ============================================================================

/**
 * Create a new file (version 1)
 */
export async function createFile(data: CreateFileInput): Promise<File> {
  return prisma.file.create({
    data: {
      classId: data.classId,
      originalFileName: data.originalFileName,
      fileType: data.fileType,
      externalVpsId: data.externalVpsId,
      externalVpsUrl: data.externalVpsUrl,
      size: data.size,
      description: data.description,
      uploadedById: data.uploadedById,
      isApproved: data.isApproved ?? false,
      approvedById: data.approvedById,
      approvedAt: data.isApproved ? new Date() : null,
      version: 1,
      isCurrentVersion: true,
    },
    include: fileIncludes,
  });
}

/**
 * Create a new file version linked to parent
 * Automatically:
 * - Sets version to parent.version + 1
 * - Sets isCurrentVersion = true
 * - Updates parent's isCurrentVersion = false
 */
export async function createFileVersion(
  data: CreateFileVersionInput,
): Promise<File> {
  // Get parent file to determine version number
  const parentFile = await prisma.file.findUnique({
    where: { id: data.parentFileId },
  });

  if (!parentFile) {
    throw new Error(`Parent file not found: ${data.parentFileId}`);
  }

  const newVersion = parentFile.version + 1;

  // Transaction: create new version + update parent's isCurrentVersion
  const [newFile] = await prisma.$transaction([
    prisma.file.create({
      data: {
        classId: data.classId,
        originalFileName: data.originalFileName,
        fileType: data.fileType,
        externalVpsId: data.externalVpsId,
        externalVpsUrl: data.externalVpsUrl,
        size: data.size,
        description: data.description,
        uploadedById: data.uploadedById,
        isApproved: false,
        version: newVersion,
        parentFileId: data.parentFileId,
        isCurrentVersion: true,
      },
      include: fileIncludes,
    }),
    prisma.file.update({
      where: { id: data.parentFileId },
      data: { isCurrentVersion: false },
    }),
  ]);

  return newFile;
}

/**
 * Get a file by ID
 */
export async function getFileById(id: string): Promise<File | null> {
  return prisma.file.findUnique({
    where: { id },
    include: fileIncludes,
  });
}

/**
 * Get approved, non-deleted, current version files for a class (user view)
 */
export async function getApprovedFilesForClass(
  classId: string,
  pagination?: PaginationParams,
): Promise<File[]> {
  return prisma.file.findMany({
    where: {
      classId,
      isApproved: true,
      isDeleted: false,
      isCurrentVersion: true,
    },
    include: fileIncludes,
    orderBy: { uploadedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get all files for a class including pending and deleted (admin view)
 */
export async function getAllFilesForClassAdmin(
  classId: string,
  pagination?: PaginationParams,
): Promise<File[]> {
  return prisma.file.findMany({
    where: { classId },
    include: fileIncludes,
    orderBy: [{ originalFileName: "asc" }, { version: "desc" }],
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get all versions of a file (entire version chain)
 * Traverses up to find root, then gets all descendants
 */
export async function getFileVersionHistory(fileId: string): Promise<File[]> {
  // First, find the root file (the one with no parent)
  const initialFile = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!initialFile) {
    return [];
  }

  // Traverse up to find root
  let currentFile: typeof initialFile = initialFile;
  while (currentFile.parentFileId) {
    const parent = await prisma.file.findUnique({
      where: { id: currentFile.parentFileId },
    });
    if (!parent) break;
    currentFile = parent;
  }

  const rootId = currentFile.id;

  // For complete chain retrieval, collect all versions iteratively
  const versionMap = new Map<string, File>();
  const queue: string[] = [rootId];

  // Get versions iteratively (handles chains of any depth)
  while (queue.length > 0) {
    const parentId = queue.shift()!;

    const children = await prisma.file.findMany({
      where: { parentFileId: parentId },
      include: fileIncludes,
    });

    for (const child of children) {
      if (!versionMap.has(child.id)) {
        versionMap.set(child.id, child);
        queue.push(child.id);
      }
    }
  }

  // Get the root file with full includes
  const rootFile = await prisma.file.findUnique({
    where: { id: rootId },
    include: fileIncludes,
  });

  if (rootFile) {
    versionMap.set(rootId, rootFile);
  }

  // Return sorted by version
  return Array.from(versionMap.values()).sort((a, b) => a.version - b.version);
}

/**
 * Approve a file
 */
export async function approveFile(
  id: string,
  approvedById: string,
): Promise<File> {
  return prisma.file.update({
    where: { id },
    data: {
      isApproved: true,
      approvedById,
      approvedAt: new Date(),
    },
    include: fileIncludes,
  });
}

/**
 * Soft delete a file (mark as deleted)
 */
export async function softDeleteFile(
  id: string,
  deletedById: string,
): Promise<File> {
  return prisma.file.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedById,
      deletedAt: new Date(),
    },
    include: fileIncludes,
  });
}

/**
 * Set the isCurrentVersion flag for a file
 */
export async function setCurrentVersion(
  id: string,
  isCurrent: boolean,
): Promise<File> {
  return prisma.file.update({
    where: { id },
    data: { isCurrentVersion: isCurrent },
    include: fileIncludes,
  });
}

/**
 * Get a file with its access logs
 */
export async function getFileWithAccessLogs(
  id: string,
  pagination?: PaginationParams,
): Promise<File | null> {
  return prisma.file.findUnique({
    where: { id },
    include: {
      ...fileIncludes,
      accessLogs: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { accessedAt: "desc" },
        skip: pagination?.skip,
        take: pagination?.take,
      },
    },
  });
}

/**
 * Count files in a class
 */
export async function countFilesInClass(
  classId: string,
  approvedOnly: boolean = true,
): Promise<number> {
  return prisma.file.count({
    where: {
      classId,
      ...(approvedOnly
        ? {
            isApproved: true,
            isDeleted: false,
            isCurrentVersion: true,
          }
        : {}),
    },
  });
}

/**
 * Get pending (unapproved) files for admin review
 */
export async function getPendingFiles(
  pagination?: PaginationParams,
): Promise<File[]> {
  return prisma.file.findMany({
    where: {
      isApproved: false,
      isDeleted: false,
    },
    include: fileIncludes,
    orderBy: { uploadedAt: "asc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Rename a file (update the display name)
 * This updates the originalFileName which is used as the display nickname.
 * Does NOT affect storage path or actual file on disk.
 */
export async function renameFile(
  id: string,
  newFileName: string,
): Promise<File> {
  if (!newFileName.trim()) {
    throw new Error("File name cannot be empty");
  }

  return prisma.file.update({
    where: { id },
    data: {
      originalFileName: newFileName.trim(),
    },
    include: fileIncludes,
  });
}
