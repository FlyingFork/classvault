"use client";

import { useEffect } from "react";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { EmptyState } from "@/app/components/admin";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error boundary", error);
  }, [error]);

  return (
    <EmptyState
      icon={<ExclamationTriangleIcon width={32} height={32} />}
      title="Failed to load dashboard"
      description={
        error.message || "Something went wrong while loading your dashboard"
      }
      actionLabel="Try again"
      onAction={reset}
    />
  );
}
