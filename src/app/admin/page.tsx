import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/prisma";
import {
  countClasses,
  countPendingRequests,
  getPendingRequests,
} from "@/lib/database";
import { AdminDashboardClient } from "./AdminDashboardClient";

async function getDashboardData() {
  const [
    totalUsers,
    totalClasses,
    pendingRequests,
    totalFiles,
    recentRequests,
    recentActivity,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),
    // Active classes
    countClasses(true),
    // Pending requests
    countPendingRequests(),
    // Total approved files
    prisma.file.count({
      where: { isApproved: true, isDeleted: false, isCurrentVersion: true },
    }),
    // Recent pending requests (latest 5)
    getPendingRequests({ take: 5 }),
    // Recent activity (approved/rejected in last 7 days)
    prisma.fileUploadRequest.findMany({
      where: {
        status: { in: ["approved", "rejected"] },
        respondedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: { select: { name: true, email: true } },
        respondedBy: { select: { name: true } },
        class: { select: { name: true } },
      },
      orderBy: { respondedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    stats: {
      totalUsers,
      totalClasses,
      pendingRequests,
      totalFiles,
    },
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      userName: (r as { user?: { name?: string } }).user?.name || "Unknown",
      className: (r as { class?: { name?: string } }).class?.name || "Unknown",
      requestedAt: r.requestedAt.toISOString(),
    })),
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      status: a.status,
      userName: a.user?.name || "Unknown",
      respondedByName: a.respondedBy?.name || "Unknown",
      respondedAt: a.respondedAt?.toISOString() || null,
    })),
  };
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const data = await getDashboardData();

  return <AdminDashboardClient data={data} />;
}
