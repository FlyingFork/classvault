import { prisma } from "@/prisma";
import type { Class } from "@/generated/prisma/client";

// ============================================================================
// Types
// ============================================================================

export type CreateClassInput = {
  name: string;
  description?: string;
  allowedFileTypes?: string[];
  createdById: string;
};

export type UpdateClassInput = {
  name?: string;
  description?: string;
  allowedFileTypes?: string[];
};

export type PaginationParams = {
  skip?: number;
  take?: number;
};

// ============================================================================
// Class Methods
// ============================================================================

/**
 * Create a new class
 */
export async function createClass(data: CreateClassInput): Promise<Class> {
  return prisma.class.create({
    data: {
      name: data.name,
      description: data.description,
      allowedFileTypes: data.allowedFileTypes ?? [],
      createdById: data.createdById,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get a class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
  return prisma.class.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Get all active classes (for regular users)
 */
export async function getAllClasses(
  pagination?: PaginationParams,
): Promise<Class[]> {
  return prisma.class.findMany({
    where: { isActive: true },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { name: "asc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get all classes including inactive (for admins)
 */
export async function getAllClassesAdmin(
  pagination?: PaginationParams,
): Promise<Class[]> {
  return prisma.class.findMany({
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Update a class
 */
export async function updateClass(
  id: string,
  data: UpdateClassInput,
): Promise<Class> {
  return prisma.class.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      allowedFileTypes: data.allowedFileTypes,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Soft delete a class (set isActive = false)
 */
export async function softDeleteClass(id: string): Promise<Class> {
  return prisma.class.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Restore a soft-deleted class (set isActive = true)
 */
export async function restoreClass(id: string): Promise<Class> {
  return prisma.class.update({
    where: { id },
    data: { isActive: true },
  });
}

/**
 * Get class with its files
 * For non-admins: only approved, non-deleted, current version files
 * For admins: all files
 */
export async function getClassWithFiles(
  id: string,
  isAdmin: boolean = false,
  pagination?: PaginationParams,
): Promise<Class | null> {
  const fileWhere = isAdmin
    ? {}
    : {
        isApproved: true,
        isDeleted: false,
        isCurrentVersion: true,
      };

  return prisma.class.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      files: {
        where: fileWhere,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { uploadedAt: "desc" },
        skip: pagination?.skip,
        take: pagination?.take,
      },
    },
  });
}

/**
 * Count total active classes (for pagination)
 */
export async function countClasses(
  activeOnly: boolean = true,
): Promise<number> {
  return prisma.class.count({
    where: activeOnly ? { isActive: true } : {},
  });
}
