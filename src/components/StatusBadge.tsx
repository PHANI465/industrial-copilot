"use client";

import { Badge } from "@/components/ui/badge";
import type { StatusLevel } from "@/lib/types";

const STATUS_CONFIG: Record<StatusLevel, { label: string; className: string }> = {
  NORMAL: {
    label: "NORMAL",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  ADVISORY: {
    label: "ADVISORY",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  WARNING: {
    label: "WARNING",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  CRITICAL: {
    label: "CRITICAL",
    className: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse",
  },
};

export function StatusBadge({ status }: { status: StatusLevel }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`text-xs font-mono ${config.className}`}>
      {config.label}
    </Badge>
  );
}
