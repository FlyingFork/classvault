"use client";

import { Badge } from "@radix-ui/themes";

type Status = "pending" | "approved" | "rejected" | "active" | "inactive";

interface StatusBadgeProps {
  status: Status;
  size?: "1" | "2" | "3";
}

const STATUS_CONFIG: Record<
  Status,
  { color: "orange" | "green" | "red" | "blue" | "gray"; label: string }
> = {
  pending: { color: "orange", label: "Pending" },
  approved: { color: "green", label: "Approved" },
  rejected: { color: "red", label: "Rejected" },
  active: { color: "blue", label: "Active" },
  inactive: { color: "gray", label: "Inactive" },
};

export function StatusBadge({ status, size = "1" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge color={config.color} size={size} variant="soft">
      {config.label}
    </Badge>
  );
}
