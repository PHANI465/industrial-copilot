"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import type { AnalysisResult } from "@/lib/types";
import { AlertTriangle, BookOpen, History, Shield } from "lucide-react";

export function SimulatorResults({
  result,
}: {
  result: AnalysisResult | null;
}) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Adjust the sliders and click &quot;Analyze&quot; to see results
      </div>
    );
  }

  const activeAlerts = result.alerts.filter((a) => a.status !== "NORMAL");

  return (
    <div className="space-y-4">
      {/* Overall status */}
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">Overall Status</p>
          <StatusBadge status={result.overallStatus} />
        </div>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Alerts ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-emerald-400">All parameters within normal range</p>
          ) : (
            <ul className="space-y-2">
              {activeAlerts.map((alert, i) => (
                <li
                  key={i}
                  className={`text-sm rounded-md px-3 py-2 border ${
                    alert.status === "CRITICAL"
                      ? "bg-red-500/5 border-red-500/20 text-red-400"
                      : alert.status === "WARNING"
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
                      : "bg-blue-500/5 border-blue-500/20 text-blue-400"
                  }`}
                >
                  {alert.reason}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="text-sm space-y-1">
                <p className="font-medium">{rec.actionSummary}</p>
                <p className="text-xs text-muted-foreground italic">
                  Reference: {rec.docId} — {rec.title}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Failure matches */}
      {result.failures.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <History className="h-4 w-4" />
              Similar Past Failures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.failures.map((f, i) => (
              <div
                key={i}
                className="rounded-md border bg-card/50 p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {f.failureEventId} — {f.failureMode}
                  </span>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {Math.round(f.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{f.likelyCause}</p>
                <p className="text-xs">
                  <span className="text-muted-foreground">Action: </span>
                  {f.correctiveAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
