"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { AdminPageLayout, EmptyState } from "@/app/components/admin";

export default function RequestDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminPageLayout
      breadcrumbs={[
        { url: "/dashboard", name: "Dashboard" },
        { url: "/dashboard/requests", name: "My Requests" },
        { url: "#", name: "Error" },
      ]}
    >
      <EmptyState
        icon={<ExclamationTriangleIcon width={32} height={32} />}
        title="Something went wrong"
        description="Failed to load request details. Please try again."
        actionLabel="Try Again"
        onAction={reset}
      />
    </AdminPageLayout>
  );
}
