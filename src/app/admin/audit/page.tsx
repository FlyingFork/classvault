import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  countAuditLogs,
  type AdminAction,
  type EntityType,
} from "@/lib/database";
import { prisma } from "@/prisma";
import { AuditLogsClient } from "./AuditLogsClient";

interface PageProps {
  searchParams: Promise<{
    adminId?: string;
    action?: string;
    entityType?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  // Build filter
  const filters: {
    adminId?: string;
    action?: AdminAction;
    entityType?: EntityType;
  } = {};
  if (params.adminId) filters.adminId = params.adminId;
  if (params.action) filters.action = params.action as AdminAction;
  if (params.entityType) filters.entityType = params.entityType as EntityType;

  // Get audit logs
  const logs = await prisma.adminAuditLog.findMany({
    where: {
      ...(filters.adminId && { adminId: filters.adminId }),
      ...(filters.action && { action: filters.action }),
      ...(filters.entityType && { entityType: filters.entityType }),
    },
    include: {
      admin: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { performedAt: "desc" },
    take: 100,
  });

  // Get unique admins for filter
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Define available actions and entity types
  const actions = [
    "approve_request",
    "reject_request",
    "delete_file",
    "restore_file",
    "rename_file",
    "create_class",
    "update_class",
    "delete_class",
    "restore_class",
    "ban_user",
    "unban_user",
    "change_role",
    "reset_password",
  ];

  const entityTypes = ["file", "request", "class", "user", "notification"];

  const logsData = logs.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    description: log.description,
    metadata: log.metadata,
    performedAt: log.performedAt.toISOString(),
    adminId: log.adminId,
    adminName: log.admin?.name || "Unknown",
    adminEmail: log.admin?.email || "",
  }));

  const adminsData = admins.map((a) => ({
    id: a.id,
    name: a.name || a.email || "Unknown",
  }));

  const totalCount = await countAuditLogs(filters);

  return (
    <AuditLogsClient
      logs={logsData}
      admins={adminsData}
      actions={actions}
      entityTypes={entityTypes}
      totalCount={totalCount}
      initialAdminFilter={params.adminId}
      initialActionFilter={params.action}
      initialEntityTypeFilter={params.entityType}
    />
  );
}
