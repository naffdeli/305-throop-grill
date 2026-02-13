"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  status: "pending" | "preparing" | "ready" | "picked_up" | "no_show" | "cancelled";
  className?: string;
}

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  preparing: { label: "Preparing", className: "bg-blue-100 text-blue-800" },
  ready: { label: "Ready", className: "bg-green-100 text-green-800" },
  picked_up: { label: "Picked Up", className: "bg-gray-100 text-gray-800" },
  no_show: { label: "No Show", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
};

export function StatusBadge({ status, className }: BadgeProps) {
  const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface FlagBadgeProps {
  isFlagged: boolean;
  noShowCount: number;
}

export function CustomerFlagBadge({ isFlagged, noShowCount }: FlagBadgeProps) {
  if (!isFlagged) return null;
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      Flagged ({noShowCount} no-shows)
    </span>
  );
}
