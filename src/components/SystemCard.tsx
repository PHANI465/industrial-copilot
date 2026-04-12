"use client";

import { createElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { SensorDisplay } from "./SensorDisplay";
import { AlertBox } from "./AlertBox";
import type { AnalysisResult } from "@/lib/types";
import {
  Activity, Droplets, Flame, Wind, Cog, Zap, Box,
  Gauge, Thermometer, Waves, ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const ICON_BY_TYPE: Record<string, LucideIcon> = {
  vessel: Droplets,
  separator: Droplets,
  separationvessel: Droplets,
  scrubber: Box,
  knockoutdrum: Box,
  storagetank: Box,
  receiver: Box,
  hydrocyclone: Waves,
  pump: Activity,
  centrifugalpump: Activity,
  heatexchanger: Flame,
  "shell&tube": Thermometer,
  aircooled: Wind,
  compressor: Cog,
  centrifugal: Cog,
  reciprocating: Cog,
  generator: Zap,
  dieselgenerator: Zap,
  instrument: Gauge,
  valve: Gauge,
};

function resolveIconForAsset(type?: string, subtype?: string): LucideIcon {
  if (subtype) {
    const icon = ICON_BY_TYPE[subtype.toLowerCase()];
    if (icon) return icon;
  }
  if (type) {
    const icon = ICON_BY_TYPE[type.toLowerCase()];
    if (icon) return icon;
  }
  return Cog;
}

export interface AssetInfo {
  tag: string;
  name: string;
  type?: string;
  subtype?: string;
}

export function SystemCard({
  assetTag,
  assetInfo,
  sensors,
  analysis,
  selected,
  onClick,
  compact,
}: {
  assetTag: string;
  assetInfo?: AssetInfo;
  sensors: Record<string, number>;
  analysis: AnalysisResult | null;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const name = assetInfo?.name || assetTag;
  const status = analysis?.overallStatus || "NORMAL";
  
  const statusGlow = {
    CRITICAL: "shadow-red-500/20 border-red-500/40",
    WARNING: "shadow-amber-500/15 border-amber-500/30",
    ADVISORY: "shadow-blue-500/10 border-blue-500/25",
    NORMAL: "border-border",
  }[status] || "border-border";

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 ${statusGlow} ${
        selected ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-1.5 rounded-md ${
              status === "CRITICAL" ? "bg-red-500/15" :
              status === "WARNING" ? "bg-amber-500/15" :
              status === "ADVISORY" ? "bg-blue-500/15" :
              "bg-muted"
            }`}>
              {createElement(resolveIconForAsset(assetInfo?.type, assetInfo?.subtype), {
                className: `h-4 w-4 ${
                  status === "CRITICAL" ? "text-red-400" :
                  status === "WARNING" ? "text-amber-400" :
                  status === "ADVISORY" ? "text-blue-400" :
                  "text-muted-foreground"
                }`,
              })}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-mono font-bold tracking-tight">{assetTag}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">{name}</p>
            </div>
          </div>
          {analysis && <StatusBadge status={analysis.overallStatus} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SensorDisplay
          sensors={sensors}
          alerts={analysis?.alerts}
        />
        {!compact && analysis && (
          <AlertBox
            alerts={analysis.alerts}
            recommendations={analysis.recommendations}
          />
        )}
        <Link
          href={`/assets/${assetTag}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          View Details
        </Link>
      </CardContent>
    </Card>
  );
}
