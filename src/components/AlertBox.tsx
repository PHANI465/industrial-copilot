"use client";

import { AlertTriangle, CheckCircle, AlertCircle, XOctagon, Wrench } from "lucide-react";
import type { AnomalyResult, Recommendation } from "@/lib/types";

const ICON_MAP = {
  NORMAL: CheckCircle,
  ADVISORY: AlertCircle,
  WARNING: AlertTriangle,
  CRITICAL: XOctagon,
};

const BG_MAP = {
  NORMAL: "bg-emerald-500/10 border-emerald-500/25",
  ADVISORY: "bg-cyan-500/10 border-cyan-500/25",
  WARNING: "bg-amber-500/10 border-amber-500/25",
  CRITICAL: "bg-red-500/15 border-red-500/30",
};

const TEXT_MAP = {
  NORMAL: "text-emerald-400",
  ADVISORY: "text-cyan-400",
  WARNING: "text-amber-400",
  CRITICAL: "text-red-400",
};

export function AlertBox({
  alerts,
  recommendations,
}: {
  alerts: AnomalyResult[];
  recommendations?: Recommendation[];
}) {
  const activeAlerts = alerts.filter((a) => a.status !== "NORMAL");

  if (activeAlerts.length === 0) {
    return (
      <div className={`rounded-md border p-2 ${BG_MAP.NORMAL}`}>
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400">All parameters normal</span>
        </div>
      </div>
    );
  }

  const topAlert = activeAlerts[0];
  const Icon = ICON_MAP[topAlert.status];

  return (
    <div className="space-y-1.5">
      <div className={`rounded-md border p-2 ${BG_MAP[topAlert.status]}`}>
        <div className="flex items-start gap-1.5">
          <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${TEXT_MAP[topAlert.status]}`} />
          <div className="space-y-0.5 min-w-0">
            <p className={`text-xs font-medium ${TEXT_MAP[topAlert.status]}`}>
              {topAlert.reason}
            </p>
            {activeAlerts.length > 1 && (
              <p className="text-xs text-muted-foreground">
                +{activeAlerts.length - 1} more alert{activeAlerts.length > 2 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>
      {recommendations && recommendations.length > 0 && (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Wrench className="h-3 w-3 text-primary" />
            <p className="text-xs text-primary font-medium">Recommended Action</p>
          </div>
          <p className="text-xs leading-relaxed">{recommendations[0].actionSummary}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">
            REF: {recommendations[0].docId}
          </p>
        </div>
      )}
    </div>
  );
}
