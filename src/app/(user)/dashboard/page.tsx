import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getActiveClasses,
  getUserDashboardData,
} from "@/lib/database/dashboard";
import { DashboardClient } from "./DashboardClient";

export default async function UserDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const [dashboardData, activeClasses] = await Promise.all([
    getUserDashboardData(session.user.id),
    getActiveClasses(),
  ]);

  const serializedData = {
    stats: dashboardData.stats,
    recentRequests: dashboardData.recentRequests.map((request) => ({
      ...request,
      size: Number(request.size),
      requestedAt: request.requestedAt.toISOString(),
      respondedAt: request.respondedAt?.toISOString() ?? null,
    })),
    recentNotifications: dashboardData.recentNotifications.map(
      (notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      }),
    ),
  };

  const serializedClasses = activeClasses.map((cls) => ({
    ...cls,
  }));

  return (
    <DashboardClient
      userData={{
        id: session.user.id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role ?? "user",
      }}
      dashboardData={serializedData}
      activeClasses={serializedClasses}
    />
  );
}
