"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, AlertCircle, XOctagon } from "lucide-react";
import type { StatusLevel } from "@/lib/types";

const STATUS_CONFIG: Record<StatusLevel, { label: string; className: string; icon: typeof CheckCircle }> = {
  NORMAL: {
    label: "NORMAL",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/10",
    icon: CheckCircle,
  },
  ADVISORY: {
    label: "ADVISORY",
    className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25 shadow-sm shadow-cyan-500/10",
    icon: AlertCircle,
  },
  WARNING: {
    label: "WARNING",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-sm shadow-amber-500/10",
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: "CRITICAL",
    className: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse shadow-sm shadow-red-500/20",
    icon: XOctagon,
  },
};

export function StatusBadge({ status }: { status: StatusLevel }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`text-[10px] font-mono font-semibold tracking-wide gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
