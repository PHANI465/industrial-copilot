"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCriticalAlertNotify } from "@/hooks/useCriticalAlertNotify";
import { AlertEmailSubscribe } from "@/components/AlertEmailSubscribe";
import { SystemCard } from "@/components/SystemCard";
import type { AssetInfo } from "@/components/SystemCard";
import { TrendChart } from "@/components/TrendChart";
import { ChatPanel } from "@/components/ChatPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisResult, AnomalyResult, SimulateResponse } from "@/lib/types";
import {
  Activity, Radio, Shield, MessageSquare, AlertTriangle,
  ChevronDown, ChevronUp, X, Filter, Download, Search,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";

interface AssetEntry {
  tag: string;
  name: string;
  type: string;
  subtype: string;
  area: string;
  criticality: string;
  sensorCount: number;
  dataSource: "timeseries" | "simulated";
}

interface AssetState {
  sensors: Record<string, number>;
  analysis: AnalysisResult | null;
  timestamp: string;
}

interface TrendPoint {
  timestamp: string;
  sensors: Record<string, number>;
}

interface AlertLogEntry {
  id: string;
  asset: string;
  sensorType: string;
  status: string;
  value: number;
  unit: string;
  reason: string;
  timestamp: string;
}

const SCENARIOS = [
  { value: "", label: "Live (Full Data)" },
  { value: "normal", label: "Normal Operation" },
  { value: "degrading", label: "Degrading (HX Fouling)" },
  { value: "failure", label: "Failure (Pump Bearing)" },
  { value: "random", label: "Random Chaos" },
];

const DEFAULT_ASSETS = ["V-101", "K-201", "E-301", "K-401", "P-501"];
const MAX_ALERT_LOG = 50;

export default function DashboardPage() {
  const [scenario, setScenario] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string>("V-101");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1500);
  const indices = useRef<Record<string, number>>({});

  const [allAssets, setAllAssets] = useState<Record<string, AssetEntry[]>>({});
  const [activeAssets, setActiveAssets] = useState<string[]>(DEFAULT_ASSETS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");

  const [assetStates, setAssetStates] = useState<Record<string, AssetState>>({});
  const [trendData, setTrendData] = useState<Record<string, TrendPoint[]>>({});
  const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);
  const [staticTimeseriesTags, setStaticTimeseriesTags] = useState<string[]>([]);

  const assetInfoMap = useMemo(() => {
    const map: Record<string, AssetInfo> = {};
    for (const group of Object.values(allAssets)) {
      for (const a of group) {
        map[a.tag] = { tag: a.tag, name: a.name, type: a.type, subtype: a.subtype };
      }
    }
    return map;
  }, [allAssets]);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data) => setAllAssets(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/timeseries-tags")
      .then((r) => r.json())
      .then((data: { tags?: string[] }) => setStaticTimeseriesTags(data.tags || []))
      .catch(() => setStaticTimeseriesTags([]));
  }, []);

  const fetchData = useCallback(
    async (asset: string) => {
      const idx = indices.current[asset] || 0;
      const params = new URLSearchParams({
        asset,
        index: idx.toString(),
        ...(scenario ? { scenario } : {}),
      });

      try {
        const res = await fetch(`/api/simulate?${params}`);
        if (!res.ok) return;
        const data: SimulateResponse = await res.json();

        indices.current[asset] = data.index + 1;

        setAssetStates((prev) => ({
          ...prev,
          [asset]: {
            sensors: data.sensors,
            analysis: data.analysis,
            timestamp: data.timestamp,
          },
        }));

        setTrendData((prev) => {
          const existing = prev[asset] || [];
          const updated = [
            ...existing,
            { timestamp: data.timestamp, sensors: data.sensors },
          ].slice(-60);
          return { ...prev, [asset]: updated };
        });

        if (data.analysis) {
          const nonNormalAlerts = data.analysis.alerts.filter(
            (a: AnomalyResult) => a.status !== "NORMAL"
          );
          if (nonNormalAlerts.length > 0) {
            setAlertLog((prev) => {
              const now = Date.now();
              const newEntries: AlertLogEntry[] = nonNormalAlerts.map(
                (a: AnomalyResult, i: number) => ({
                  id: `${asset}-${now}-${data.index}-${i}`,
                  asset,
                  sensorType: a.sensorType,
                  status: a.status,
                  value: a.value,
                  unit: a.unit,
                  reason: a.reason,
                  timestamp: data.timestamp,
                })
              );
              return [...newEntries, ...prev].slice(0, MAX_ALERT_LOG);
            });
          }
        }
      } catch {
        // silently retry on next tick
      }
    },
    [scenario]
  );

  useEffect(() => {
    if (!running || activeAssets.length === 0) return;

    const interval = setInterval(() => {
      for (const asset of activeAssets) {
        void fetchData(asset);
      }
    }, speed);

    const boot = window.setTimeout(() => {
      for (const asset of activeAssets) {
        void fetchData(asset);
      }
    }, 0);

    return () => {
      clearInterval(interval);
      clearTimeout(boot);
    };
  }, [running, speed, fetchData, activeAssets]);

  useEffect(() => {
    indices.current = {};
    queueMicrotask(() => {
      setTrendData({});
      setAlertLog([]);
    });
  }, [scenario]);

  const toggleAsset = (tag: string) => {
    setActiveAssets((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeAlertCount = Object.entries(assetStates)
    .filter(([tag]) => activeAssets.includes(tag))
    .reduce((sum, [, s]) => {
      return sum + (s.analysis?.alerts.filter((a) => a.status !== "NORMAL").length || 0);
    }, 0);

  const worstStatus = Object.entries(assetStates)
    .filter(([tag]) => activeAssets.includes(tag))
    .reduce((worst, [, s]) => {
      const statuses = ["NORMAL", "ADVISORY", "WARNING", "CRITICAL"];
      const current = s.analysis?.overallStatus || "NORMAL";
      return statuses.indexOf(current) > statuses.indexOf(worst) ? current : worst;
    }, "NORMAL");

  const isCritical = worstStatus === "CRITICAL";

  const criticalAssets = useMemo(
    () =>
      Object.entries(assetStates)
        .filter(
          ([tag, s]) =>
            activeAssets.includes(tag) && s.analysis?.overallStatus === "CRITICAL"
        )
        .map(([tag]) => tag),
    [assetStates, activeAssets]
  );

  useCriticalAlertNotify(isCritical, criticalAssets, "dashboard");

  const statusColor = (status: string) => {
    switch (status) {
      case "CRITICAL": return "text-red-400";
      case "WARNING": return "text-amber-400";
      case "ADVISORY": return "text-yellow-400";
      default: return "text-emerald-400";
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case "CRITICAL": return "bg-red-500/15 border-red-500/30";
      case "WARNING": return "bg-amber-500/15 border-amber-500/30";
      case "ADVISORY": return "bg-yellow-500/15 border-yellow-500/30";
      default: return "bg-emerald-500/15 border-emerald-500/30";
    }
  };

  const gridCols =
    activeAssets.length <= 3 ? "md:grid-cols-3" :
    activeAssets.length <= 5 ? "md:grid-cols-3 lg:grid-cols-5" :
    activeAssets.length <= 8 ? "md:grid-cols-4 lg:grid-cols-4" :
    "md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  return (
    <div className="space-y-6">
      {/* CRITICAL flash banner */}
      {isCritical && (
        <div className="animate-pulse bg-red-600/20 border border-red-500/60 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">
              CRITICAL CONDITION DETECTED
            </p>
            <p className="text-xs text-red-300/80">
              System{criticalAssets.length > 1 ? "s" : ""}{" "}
              <span className="font-mono font-bold">{criticalAssets.join(", ")}</span>{" "}
              {criticalAssets.length > 1 ? "are" : "is"} in CRITICAL state.
              Immediate attention required.
            </p>
          </div>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring {activeAssets.length} systems across the platform
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            Systems ({activeAssets.length})
            {filterOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="text-sm bg-card border border-border rounded-md px-3 py-1.5 outline-none"
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setRunning((r) => !r)}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
              running
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {running ? "● LIVE" : "■ PAUSED"}
          </button>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-sm bg-card border border-border rounded-md px-3 py-1.5 outline-none"
          >
            <option value={500}>0.5s</option>
            <option value={1000}>1s</option>
            <option value={1500}>1.5s</option>
            <option value={2000}>2s</option>
            <option value={3000}>3s</option>
          </select>
        </div>
      </div>

      {/* Asset filter panel */}
      {filterOpen && (() => {
        const allFlat = Object.values(allAssets).flat();
        const withSensors = allFlat.filter((a) => a.sensorCount > 0);
        const q = filterSearch.toLowerCase();
        const matchesSearch = (a: AssetEntry) =>
          !q || a.tag.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
            || a.type.toLowerCase().includes(q) || a.subtype.toLowerCase().includes(q);

        return (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Select systems to monitor</p>
                  <span className="text-[10px] text-muted-foreground">
                    {withSensors.length} available · {allFlat.length - withSensors.length} without sensors
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveAssets(withSensors.map((a) => a.tag))}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                  >
                    Select All ({withSensors.length})
                  </button>
                  <button
                    onClick={() => setActiveAssets(DEFAULT_ASSETS)}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                  >
                    Reset Default
                  </button>
                  <button
                    onClick={() => setActiveAssets([])}
                    className="text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/50 rounded-md mb-3">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search by tag, name, or type (e.g. pump, K-201, compressor)..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch("")} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {Object.entries(allAssets).map(([area, assets]) => {
                  const visible = assets.filter((a) => a.sensorCount > 0 && matchesSearch(a));
                  if (visible.length === 0) return null;
                  return (
                    <div key={area}>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        {area} ({visible.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {visible.map((a) => {
                          const isActive = activeAssets.includes(a.tag);
                          return (
                            <button
                              key={a.tag}
                              onClick={() => toggleAsset(a.tag)}
                              className={`text-xs px-2 py-1 rounded-md border transition-colors flex items-center gap-1 ${
                                isActive
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "border-border text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              <span className="font-mono font-medium">{a.tag}</span>
                              <span className="hidden sm:inline opacity-70">
                                {a.name.length > 20 ? a.name.slice(0, 20) + "…" : a.name}
                              </span>
                              <span className="text-[10px] opacity-50">{a.sensorCount}s</span>
                              {a.dataSource === "timeseries" && (
                                <span className="text-emerald-400 text-[10px]">●</span>
                              )}
                              {isActive && <X className="h-3 w-3 ml-0.5 opacity-50" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                <span className="text-emerald-400">●</span> = real time-series data &nbsp;|&nbsp;
                <span className="font-mono">Ns</span> = number of sensors &nbsp;|&nbsp;
                others use simulated data
              </p>
            </CardContent>
          </Card>
        );
      })()}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Radio className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Systems Monitored</p>
              <p className="text-lg font-bold">{activeAssets.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Activity className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
              <p className="text-lg font-bold">{activeAlertCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <Shield className={`h-5 w-5 ${
              worstStatus === "CRITICAL" ? "text-red-400" :
              worstStatus === "WARNING" ? "text-amber-400" :
              "text-emerald-400"
            }`} />
            <div>
              <p className="text-xs text-muted-foreground">System Status</p>
              <p className="text-lg font-bold">{worstStatus}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System cards */}
      {activeAssets.length > 0 && (
        <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
          {activeAssets.map((asset) => (
            <SystemCard
              key={asset}
              assetTag={asset}
              assetInfo={assetInfoMap[asset]}
              sensors={assetStates[asset]?.sensors || {}}
              analysis={assetStates[asset]?.analysis || null}
              selected={selectedAsset === asset}
              onClick={() => setSelectedAsset(asset)}
              compact={activeAssets.length > 6}
            />
          ))}
        </div>
      )}

      {activeAssets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No systems selected. Click the &quot;Systems&quot; button above to pick
              which equipment to monitor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trend chart + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
              <Activity className="h-4 w-4" />
              <span className="font-normal text-muted-foreground">Trends for</span>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="font-mono font-bold bg-accent/50 border border-border rounded px-2 py-0.5 text-sm outline-none"
              >
                {activeAssets.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag} {assetInfoMap[tag] ? `— ${assetInfoMap[tag].name}` : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground font-normal ml-auto flex items-center gap-2">
                Last {trendData[selectedAsset]?.length || 0} readings
                {staticTimeseriesTags.includes(selectedAsset) && (
                  <a
                    href={`/api/export?type=timeseries&tag=${encodeURIComponent(selectedAsset)}`}
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    title="Download full static time-series (15-min intervals) as CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Full CSV
                  </a>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData[selectedAsset] || []}
              assetTag={selectedAsset}
            />
          </CardContent>
        </Card>

        <Card className="h-[420px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-3rem)]">
            <ChatPanel liveData={assetStates} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts Log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Recent Alerts
            <span className="text-xs text-muted-foreground font-normal ml-2">
              Last {alertLog.length} non-normal readings across monitored systems
            </span>
            {alertLog.length > 0 && (
              <button
                onClick={() => {
                  downloadCSV(
                    `alerts-${new Date().toISOString().slice(0, 10)}.csv`,
                    ["Time", "System", "Sensor", "Status", "Value", "Unit", "Details"],
                    alertLog.map((e) => [
                      e.timestamp, e.asset, e.sensorType, e.status,
                      e.value.toFixed(2), e.unit, e.reason,
                    ])
                  );
                }}
                className="ml-auto text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Export alerts as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertLog.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No alerts recorded yet. All systems operating normally.
            </p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">System</th>
                    <th className="py-2 pr-3">Sensor</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {alertLog.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {entry.timestamp.split("T")[1]?.slice(0, 8) || entry.timestamp}
                      </td>
                      <td className="py-1.5 pr-3 font-mono font-medium">
                        {entry.asset}
                      </td>
                      <td className="py-1.5 pr-3 text-xs">
                        {entry.sensorType}
                      </td>
                      <td className="py-1.5 pr-3">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border ${statusBg(entry.status)} ${statusColor(entry.status)}`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 font-mono text-xs">
                        {entry.value.toFixed(2)} {entry.unit}
                      </td>
                      <td className="py-1.5 text-xs text-muted-foreground truncate max-w-[250px]">
                        {entry.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertEmailSubscribe />
    </div>
  );
}
