import { prisma } from "@/prisma";
import type { AdminAuditLog } from "@/generated/prisma/client";
import type { PaginationParams } from "./class";

// ============================================================================
// Types
// ============================================================================

export type AdminAction =
  | "approve_request"
  | "reject_request"
  | "delete_file"
  | "restore_file"
  | "rename_file"
  | "create_class"
  | "update_class"
  | "delete_class"
  | "restore_class"
  | "ban_user"
  | "unban_user"
  | "change_role"
  | "reset_password";

export type EntityType = "file" | "request" | "class" | "user" | "notification";

export type CreateAuditLogInput = {
  adminId: string;
  action: AdminAction;
  entityType: EntityType;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
};

// Common includes for audit log queries
const auditLogIncludes = {
  admin: {
    select: { id: true, name: true, email: true },
  },
};

// ============================================================================
// Admin Audit Log Methods
// ============================================================================

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  data: CreateAuditLogInput,
): Promise<AdminAuditLog> {
  return prisma.adminAuditLog.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
    include: auditLogIncludes,
  });
}

/**
 * Get all audit logs with pagination
 */
export async function getAuditLogs(
  pagination?: PaginationParams,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get audit logs by admin
 */
export async function getAuditLogsByAdmin(
  adminId: string,
  pagination?: PaginationParams,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    where: { adminId },
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsByEntity(
  entityType: EntityType,
  entityId: string,
  pagination?: PaginationParams,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    where: { entityType, entityId },
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(
  action: AdminAction,
  pagination?: PaginationParams,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    where: { action },
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Get audit logs within a date range
 */
export async function getAuditLogsByDateRange(
  startDate: Date,
  endDate: Date,
  pagination?: PaginationParams,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    where: {
      performedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    skip: pagination?.skip,
    take: pagination?.take,
  });
}

/**
 * Count total audit logs
 */
export async function countAuditLogs(filters?: {
  adminId?: string;
  action?: AdminAction;
  entityType?: EntityType;
}): Promise<number> {
  return prisma.adminAuditLog.count({
    where: {
      ...(filters?.adminId && { adminId: filters.adminId }),
      ...(filters?.action && { action: filters.action }),
      ...(filters?.entityType && { entityType: filters.entityType }),
    },
  });
}

/**
 * Get recent audit logs for dashboard
 */
export async function getRecentAuditLogs(
  limit: number = 10,
): Promise<AdminAuditLog[]> {
  return prisma.adminAuditLog.findMany({
    include: auditLogIncludes,
    orderBy: { performedAt: "desc" },
    take: limit,
  });
}
