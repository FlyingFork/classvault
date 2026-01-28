import { prisma } from "@/prisma";

export type UserDashboardStats = {
  filesCount: number;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
  fileAccessCount: number;
};

export type RecentUploadRequest = {
  id: string;
  fileName: string;
  fileType: string;
  size: bigint;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  respondedAt: Date | null;
  rejectionReason: string | null;
  className: string;
  respondedByName: string | null;
  fileId: string | null;
};

export type RecentNotification = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
};

export type UserDashboardData = {
  stats: UserDashboardStats;
  recentRequests: RecentUploadRequest[];
  recentNotifications: RecentNotification[];
};

export type ActiveClassOption = {
  id: string;
  name: string;
  allowedFileTypes: string[];
};

export async function getUserDashboardData(
  userId: string,
): Promise<UserDashboardData> {
  const now = new Date();

  const [
    filesCount,
    pendingRequestsCount,
    unreadNotificationsCount,
    fileAccessCount,
    recentRequestsRaw,
    recentNotifications,
  ] = await Promise.all([
    prisma.file.count({
      where: {
        uploadedById: userId,
        isDeleted: false,
      },
    }),
    prisma.fileUploadRequest.count({
      where: {
        userId,
        status: "pending",
      },
    }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
        expiresAt: {
          gt: now,
        },
      },
    }),
    prisma.fileAccessLog.count({
      where: {
        userId,
      },
    }),
    prisma.fileUploadRequest.findMany({
      where: { userId },
      include: {
        class: {
          select: { name: true },
        },
        respondedBy: {
          select: { name: true },
        },
      },
      orderBy: { requestedAt: "desc" },
      take: 5,
    }),
    prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        actionUrl: true,
        actionLabel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const recentRequests: RecentUploadRequest[] = recentRequestsRaw.map(
    (request) => ({
      id: request.id,
      fileName: request.fileName,
      fileType: request.fileType,
      size: request.size,
      status: request.status as RecentUploadRequest["status"],
      requestedAt: request.requestedAt,
      respondedAt: request.respondedAt,
      rejectionReason: request.rejectionReason,
      className: request.class?.name ?? "Unknown Class",
      respondedByName: request.respondedBy?.name ?? null,
      fileId: request.fileId,
    }),
  );

  return {
    stats: {
      filesCount,
      pendingRequestsCount,
      unreadNotificationsCount,
      fileAccessCount,
    },
    recentRequests,
    recentNotifications,
  };
}

export async function getActiveClasses(): Promise<ActiveClassOption[]> {
  return prisma.class.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      allowedFileTypes: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}
