"use client";

import type { AnomalyResult } from "@/lib/types";

const SENSOR_LABELS: Record<string, string> = {
  PRESS: "Pressure",
  SPRESS: "Suction Press",
  DPRESS: "Disch. Press",
  LEVEL: "Level",
  TEMP: "Temperature",
  DTEMP: "Disch. Temp",
  GAS_FLOW: "Gas Flow",
  OIL_FLOW: "Oil Flow",
  FLOW: "Flow",
  VIB: "Vibration",
  VIBDE: "Vib (DE)",
  VIBNDE: "Vib (NDE)",
  CURR: "Current",
  TINLET: "T Inlet",
  TOUTLET: "T Outlet",
  PSHELL: "P Shell",
  SURGE: "Surge Margin",
  LOAD: "Load",
  FREQ: "Frequency",
  DPRES: "Diff Press",
  PV: "Process Value",
};

const STATUS_COLORS: Record<string, string> = {
  NORMAL: "text-emerald-400",
  ADVISORY: "text-cyan-400",
  WARNING: "text-amber-400",
  CRITICAL: "text-red-400",
};

const STATUS_BG: Record<string, string> = {
  NORMAL: "",
  ADVISORY: "bg-cyan-500/5",
  WARNING: "bg-amber-500/5",
  CRITICAL: "bg-red-500/10",
};

function formatLabel(key: string): string {
  return SENSOR_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SensorDisplay({
  sensors,
  alerts,
}: {
  sensors: Record<string, number>;
  alerts?: AnomalyResult[];
}) {
  const alertMap = new Map<string, AnomalyResult>();
  if (alerts) {
    for (const a of alerts) {
      const key = a.sensorId.split("-").slice(2).join("-") ||
        a.sensorId.replace(/^[A-Z]-\d+-/, "");
      alertMap.set(key, a);
    }
  }

  return (
    <div className="space-y-0.5">
      {Object.entries(sensors).map(([key, value]) => {
        const alert = alertMap.get(key);
        const status = alert?.status || "NORMAL";
        const colorClass = STATUS_COLORS[status];
        const bgClass = STATUS_BG[status];
        const unit = alert?.unit || "";

        return (
          <div
            key={key}
            className={`flex items-center justify-between text-sm font-mono px-2 py-1 rounded ${bgClass} ${status !== "NORMAL" ? "border-l-2" : ""} ${
              status === "CRITICAL" ? "border-l-red-400" :
              status === "WARNING" ? "border-l-amber-400" :
              status === "ADVISORY" ? "border-l-cyan-400" : ""
            }`}
          >
            <span className="text-muted-foreground text-xs truncate mr-2">
              {formatLabel(key)}
            </span>
            <span className={`${colorClass} font-semibold tabular-nums`}>
              {typeof value === "number" ? value.toFixed(1) : value}
              {unit && (
                <span className="text-[10px] opacity-60 ml-0.5 font-normal">{unit}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
