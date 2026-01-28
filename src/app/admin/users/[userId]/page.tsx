import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";
import UserEditClient from "./UserEditClient";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserEditPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const { userId } = await params;

  // Fetch user with related data
  const [user, stats, recentActivity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    // Get user stats
    prisma.$transaction([
      prisma.fileUploadRequest.count({ where: { userId } }),
      prisma.fileUploadRequest.count({ where: { userId, status: "approved" } }),
      prisma.fileUploadRequest.count({ where: { userId, status: "rejected" } }),
      prisma.fileAccessLog.count({ where: { userId } }),
    ]),
    // Get recent file access logs
    prisma.fileAccessLog.findMany({
      where: { userId },
      include: {
        file: {
          select: {
            id: true,
            originalFileName: true,
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) {
    redirect("/admin/users");
  }

  const [totalRequests, approvedRequests, rejectedRequests, totalDownloads] =
    stats;

  return (
    <UserEditClient
      initialUser={{
        ...user,
        role: user.role ?? undefined,
      }}
      stats={{
        totalRequests,
        approvedRequests,
        rejectedRequests,
        totalDownloads,
      }}
      recentActivity={recentActivity.map((log) => ({
        id: log.id,
        accessedAt: log.accessedAt.toISOString(),
        fileName: log.file.originalFileName,
        fileId: log.file.id,
        className: log.file.class.name,
        ipAddress: log.ipAddress,
      }))}
    />
  );
}
