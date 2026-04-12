"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Activity, FileText, Wrench, AlertTriangle,
  Gauge, ChevronDown, ChevronUp, Download,
  ThermometerSun, Droplets, Zap, Wind,
} from "lucide-react";
import Link from "next/link";
import type { SimulateResponse } from "@/lib/types";
import { SensorDisplay } from "@/components/SensorDisplay";
import { TrendChart } from "@/components/TrendChart";

interface AssetInfo {
  tag: string;
  name: string;
  type: string;
  subtype: string;
  area: string;
  location: string;
  manufacturer: string;
  model: string;
  install_date: string;
  status: string;
  criticality: string;
}

interface SensorInfo {
  sensor_id: string;
  name: string;
  sensor_type: string;
  unit: string;
  normal_min: number;
  normal_max: number;
  alarm_low: number;
  alarm_high: number;
  trip_low: number;
  trip_high: number;
}

interface DocInfo {
  doc_id: string;
  title: string;
  doc_type: string;
  revision: string;
  author: string;
  issue_date: string;
}

interface FailureInfo {
  failure_event_id: string;
  event_timestamp: string;
  severity: string;
  failure_mode: string;
  root_cause: string;
  corrective_action: string;
  downtime_hours: number;
  production_loss_bbl: number;
}

interface WOInfo {
  work_order_id: string;
  work_order_type: string;
  priority: string;
  status: string;
  raised_date: string;
  completed_date: string;
  work_description: string;
  findings: string;
  actions_taken: string;
  downtime_hours: string;
  production_loss_bbl: string;
}

interface AssetDetail {
  asset: AssetInfo;
  sensors: SensorInfo[];
  documents: DocInfo[];
  failures: FailureInfo[];
  workOrders: WOInfo[];
  dataSource: "timeseries" | "simulated";
}

const CRIT_COLORS: Record<string, string> = {
  HIGH: "text-red-400 bg-red-500/15 border-red-500/30",
  MEDIUM: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  LOW: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
};

const TYPE_ICONS: Record<string, typeof Activity> = {
  vessel: Droplets,
  pump: Wind,
  heat_exchanger: ThermometerSun,
  compressor: Zap,
  meter: Gauge,
};

function formatDate(d: string): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function AssetDetailPage() {
  const params = useParams();
  const tag = typeof params.tag === "string" ? params.tag : "";
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [error, setError] = useState("");
  const [liveData, setLiveData] = useState<SimulateResponse | null>(null);
  const [history, setHistory] = useState<Array<{ timestamp: string; sensors: Record<string, number> }>>([]);
  const indexRef = useRef(0);
  const [expandedWO, setExpandedWO] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    fetch(`/api/asset-detail?tag=${tag}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setDetail(d);
      })
      .catch(() => setError("Failed to load"));
  }, [tag]);

  const tick = useCallback(async () => {
    if (!tag) return;
    try {
      const res = await fetch(
        `/api/simulate?asset=${tag}&scenario=normal&index=${indexRef.current}`
      );
      const data: SimulateResponse = await res.json();
      indexRef.current = data.index + 1;
      setLiveData(data);
      setHistory((prev) => {
        const next = [
          ...prev,
          { timestamp: data.timestamp, sensors: data.sensors },
        ].slice(-30);
        return next;
      });
    } catch { /* ignore */ }
  }, [tag]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [tick]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-muted-foreground animate-pulse">Loading {tag}...</span>
      </div>
    );
  }

  const { asset, sensors, documents, failures, workOrders, dataSource } = detail;
  const Icon = TYPE_ICONS[asset.type] || Activity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard" className="mt-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Icon className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">{asset.tag}</h1>
            <span className="text-lg text-muted-foreground">{asset.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${CRIT_COLORS[asset.criticality] || ""}`}>
              {asset.criticality}
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
              {dataSource === "timeseries" ? "Real Data" : "Simulated"}
            </span>
            {dataSource === "timeseries" && (
              <a
                href={`/api/export?type=timeseries&tag=${encodeURIComponent(tag)}`}
                className="text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                title="Full static time-series (15-min samples) as CSV"
              >
                <Download className="h-3 w-3" />
                Time-series CSV
              </a>
            )}
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>{asset.type} / {asset.subtype}</span>
            <span>{asset.area}</span>
            <span>{asset.location}</span>
            {asset.manufacturer && <span>{asset.manufacturer} {asset.model}</span>}
            {asset.install_date && <span>Installed: {formatDate(asset.install_date)}</span>}
          </div>
        </div>
      </div>

      {/* Live status */}
      {liveData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Live Sensors
                <span className={`ml-auto text-xs px-2 py-0.5 rounded border ${
                  liveData.analysis.overallStatus === "NORMAL" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" :
                  liveData.analysis.overallStatus === "CRITICAL" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                  "text-amber-400 bg-amber-500/15 border-amber-500/30"
                }`}>
                  {liveData.analysis.overallStatus}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <SensorDisplay sensors={liveData.sensors} alerts={liveData.analysis.alerts} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Trend (last 30 ticks)</CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-3">
              <TrendChart data={history} height={200} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sensor definitions */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Sensor Metadata ({sensors.length} sensors)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {sensors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No sensors configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-3">Sensor ID</th>
                    <th className="text-left py-2 pr-3">Name</th>
                    <th className="text-left py-2 pr-3">Type</th>
                    <th className="text-left py-2 pr-3">Unit</th>
                    <th className="text-right py-2 pr-3">Normal</th>
                    <th className="text-right py-2 pr-3">Alarm</th>
                    <th className="text-right py-2">Trip</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((s) => (
                    <tr key={s.sensor_id} className="border-b border-border/30">
                      <td className="py-1.5 pr-3 font-mono">{s.sensor_id}</td>
                      <td className="py-1.5 pr-3">{s.name}</td>
                      <td className="py-1.5 pr-3">{s.sensor_type}</td>
                      <td className="py-1.5 pr-3">{s.unit}</td>
                      <td className="py-1.5 pr-3 text-right">{s.normal_min}–{s.normal_max}</td>
                      <td className="py-1.5 pr-3 text-right">{s.alarm_low}–{s.alarm_high}</td>
                      <td className="py-1.5 text-right">{s.trip_low}–{s.trip_high}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Related Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No documents linked</p>
          ) : (
            <div className="space-y-1">
              {documents.map((d) => (
                <div key={d.doc_id} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                  <span className="font-mono text-xs text-primary">{d.doc_id}</span>
                  <span className="text-sm flex-1">{d.title}</span>
                  <span className="text-xs text-muted-foreground">{d.doc_type}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(d.issue_date)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Failure events */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Failure Events ({failures.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {failures.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No failure events on record</p>
          ) : (
            <div className="space-y-2">
              {failures.map((f) => (
                <div key={f.failure_event_id} className="border border-border/50 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      f.severity === "CRITICAL" ? "text-red-400 bg-red-500/15 border-red-500/30" :
                      "text-amber-400 bg-amber-500/15 border-amber-500/30"
                    }`}>{f.severity}</span>
                    <span className="text-sm font-medium">{f.failure_mode}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(f.event_timestamp)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.root_cause}</p>
                  <p className="text-xs mt-1">{f.corrective_action}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>Downtime: {f.downtime_hours}h</span>
                    <span>Loss: {f.production_loss_bbl} bbl</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Orders */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance History ({workOrders.length} work orders)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-3">
          {workOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No maintenance records</p>
          ) : (
            <div className="space-y-1">
              {workOrders.map((wo) => {
                const exp = expandedWO === wo.work_order_id;
                return (
                  <div key={wo.work_order_id} className="border-b border-border/30 last:border-0">
                    <button
                      className="w-full text-left py-2 flex items-center gap-3"
                      onClick={() => setExpandedWO(exp ? null : wo.work_order_id)}
                    >
                      <span className="font-mono text-xs">{wo.work_order_id}</span>
                      <span className={`text-xs ${
                        wo.work_order_type === "CORRECTIVE" || wo.work_order_type === "EMERGENCY"
                          ? "text-red-400" : "text-emerald-400"
                      }`}>{wo.work_order_type}</span>
                      <span className="text-sm flex-1 truncate">{wo.work_description}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(wo.raised_date)}</span>
                      {exp ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    {exp && (
                      <div className="pl-4 pb-2 space-y-1 text-sm">
                        <p><span className="text-xs text-muted-foreground">Findings:</span> {wo.findings || "—"}</p>
                        <p><span className="text-xs text-muted-foreground">Actions:</span> {wo.actions_taken || "—"}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>Downtime: {wo.downtime_hours}h</span>
                          <span>Loss: {wo.production_loss_bbl} bbl</span>
                          <span>Completed: {formatDate(wo.completed_date)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
