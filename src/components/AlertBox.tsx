"use client";

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import type { AnomalyResult, Recommendation } from "@/lib/types";

const ICON_MAP = {
  NORMAL: CheckCircle,
  ADVISORY: Info,
  WARNING: AlertTriangle,
  CRITICAL: XCircle,
};

const BG_MAP = {
  NORMAL: "bg-emerald-500/5 border-emerald-500/20",
  ADVISORY: "bg-blue-500/5 border-blue-500/20",
  WARNING: "bg-amber-500/5 border-amber-500/20",
  CRITICAL: "bg-red-500/5 border-red-500/20",
};

const TEXT_MAP = {
  NORMAL: "text-emerald-400",
  ADVISORY: "text-blue-400",
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
        <div className="rounded-md border bg-card/50 p-2">
          <p className="text-xs text-muted-foreground mb-0.5">Recommended Action:</p>
          <p className="text-xs">{recommendations[0].actionSummary}</p>
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            Ref: {recommendations[0].docId}
          </p>
        </div>
      )}
    </div>
  );
}
