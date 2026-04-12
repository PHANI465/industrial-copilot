"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Filter, Calendar, Zap, Download, ClipboardList, FileWarning,
} from "lucide-react";
import Link from "next/link";

interface WorkOrder {
  work_order_id: string;
  failure_event_id: string;
  asset_id: string;
  tag: string;
  area: string;
  work_order_type: string;
  priority: string;
  status: string;
  raised_date: string;
  scheduled_date: string;
  completed_date: string;
  reported_by: string;
  assigned_to: string;
  supervisor: string;
  work_description: string;
  findings: string;
  actions_taken: string;
  parts_replaced: string;
  labor_hours: string;
  downtime_hours: string;
  production_loss_bbl: string;
  scenario_id: string;
}

interface FailureEvent {
  failure_event_id: string;
  scenario_id: string;
  asset_id: string;
  tag: string;
  area: string;
  event_timestamp: string;
  detected_by: string;
  severity: string;
  safety_impact: string;
  failure_mode: string;
  root_cause: string;
  failure_mechanism: string;
  immediate_action: string;
  corrective_action: string;
  production_loss_bbl: number;
  downtime_hours: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-500/15 border-red-500/30",
  HIGH: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  MEDIUM: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  LOW: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
  PLANNED: "text-blue-400 bg-blue-500/15 border-blue-500/30",
};

const TYPE_COLORS: Record<string, string> = {
  CORRECTIVE: "text-red-400",
  EMERGENCY: "text-red-500",
  PREVENTIVE: "text-emerald-400",
  PREDICTIVE: "text-blue-400",
  INSPECTION: "text-purple-400",
  PLANNED: "text-cyan-400",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function HistoryPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [failures, setFailures] = useState<FailureEvent[]>([]);
  const [tab, setTab] = useState<"maintenance" | "failures">("maintenance");
  const [filterTag, setFilterTag] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedWO, setExpandedWO] = useState<string | null>(null);
  const [expandedFE, setExpandedFE] = useState<string | null>(null);
  const [timeseriesTags, setTimeseriesTags] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/maintenance").then((r) => r.json()).then(setWorkOrders).catch(() => {});
    fetch("/api/failures").then((r) => r.json()).then(setFailures).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/timeseries-tags")
      .then((r) => r.json())
      .then((d: { tags?: string[] }) => setTimeseriesTags(d.tags || []))
      .catch(() => setTimeseriesTags([]));
  }, []);

  const uniqueTags = [...new Set(workOrders.map((w) => w.tag))].sort();
  const uniqueTypes = [...new Set(workOrders.map((w) => w.work_order_type))].sort();

  const filteredWO = workOrders.filter((w) => {
    if (filterTag && w.tag !== filterTag) return false;
    if (filterType && w.work_order_type !== filterType) return false;
    return true;
  });

  const totalDowntime = filteredWO.reduce((s, w) => s + parseFloat(w.downtime_hours || "0"), 0);
  const totalLoss = filteredWO.reduce((s, w) => s + parseFloat(w.production_loss_bbl || "0"), 0);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 pt-6 pb-8 mb-2 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/images/maintenance-worker.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-mono text-primary tracking-wider">MAINTENANCE RECORDS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Operations History</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Browse maintenance work orders, historical failure events, and export data for analysis
          </p>
          
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Export:</span>
            <a href="/api/export?type=assets" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 hover:text-primary transition-all">
              <Download className="h-3 w-3" /> Assets
            </a>
            <a href="/api/export?type=sensors" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 hover:text-primary transition-all">
              <Download className="h-3 w-3" /> Sensors
            </a>
            {timeseriesTags.map((t) => (
              <a
                key={t}
                href={`/api/export?type=timeseries&tag=${encodeURIComponent(t)}`}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/30 hover:text-primary transition-all"
              >
                <Download className="h-3 w-3" /> {t}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-3 p-1 bg-muted/50 rounded-xl w-fit">
        <button
          onClick={() => setTab("maintenance")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "maintenance"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className={`h-4 w-4 ${tab === "maintenance" ? "text-primary" : ""}`} />
          Maintenance
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tab === "maintenance" 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          }`}>{workOrders.length}</span>
        </button>
        <button
          onClick={() => setTab("failures")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "failures"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileWarning className={`h-4 w-4 ${tab === "failures" ? "text-red-400" : ""}`} />
          Failure Events
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tab === "failures" 
              ? "bg-red-500/10 text-red-400" 
              : "bg-muted text-muted-foreground"
          }`}>{failures.length}</span>
        </button>
      </div>

      {/* Maintenance Tab */}
      {tab === "maintenance" && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-1.5 outline-none"
            >
              <option value="">All Systems</option>
              {uniqueTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-1.5 outline-none"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-3">
              {filteredWO.length} work orders · {totalDowntime.toFixed(0)}h downtime · {totalLoss.toFixed(0)} bbl loss
              <a
                href={`/api/export?type=maintenance${filterTag ? `&tag=${filterTag}` : ""}`}
                download
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </a>
            </span>
          </div>

          {/* Work Orders */}
          <div className="space-y-2">
            {filteredWO.map((wo) => {
              const isExpanded = expandedWO === wo.work_order_id;
              return (
                <Card key={wo.work_order_id}>
                  <CardContent className="py-3">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedWO(isExpanded ? null : wo.work_order_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          <span className="font-mono text-xs font-medium">{wo.work_order_id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/assets/${wo.tag}`}
                              className="font-mono text-sm font-bold hover:text-primary transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {wo.tag}
                            </Link>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[wo.priority] || ""}`}>
                              {wo.priority}
                            </span>
                            <span className={`text-xs font-medium ${TYPE_COLORS[wo.work_order_type] || "text-muted-foreground"}`}>
                              {wo.work_order_type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {wo.work_description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">{formatDate(wo.raised_date)}</p>
                          <p className="text-xs font-mono">
                            {wo.downtime_hours}h · {wo.production_loss_bbl} bbl
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Work Description</p>
                            <p>{wo.work_description}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Findings</p>
                            <p>{wo.findings || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Actions Taken</p>
                            <p>{wo.actions_taken || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Parts Replaced</p>
                            <p>{wo.parts_replaced || "—"}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                          <span>Reported: {wo.reported_by}</span>
                          <span>Assigned: {wo.assigned_to}</span>
                          <span>Supervisor: {wo.supervisor}</span>
                          <span>Labor: {wo.labor_hours}h</span>
                          <span>Scheduled: {formatDate(wo.scheduled_date)}</span>
                          <span>Completed: {formatDate(wo.completed_date)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Failures Tab */}
      {tab === "failures" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <a
              href="/api/export?type=failures"
              download
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </div>
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            {failures.map((fe) => {
              const isExpanded = expandedFE === fe.failure_event_id;
              return (
                <div key={fe.failure_event_id} className="relative pl-10 pb-6">
                  <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                    fe.severity === "CRITICAL" ? "bg-red-400 border-red-400" :
                    fe.severity === "HIGH" ? "bg-amber-400 border-amber-400" :
                    "bg-blue-400 border-blue-400"
                  }`} />

                  <Card>
                    <CardContent className="py-3">
                      <button
                        className="w-full text-left"
                        onClick={() => setExpandedFE(isExpanded ? null : fe.failure_event_id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{formatDate(fe.event_timestamp)}</span>
                              <Link
                                href={`/assets/${fe.tag}`}
                                className="font-mono text-sm font-bold hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {fe.tag}
                              </Link>
                              <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[fe.severity] || ""}`}>
                                {fe.severity}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{fe.failure_mode}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{fe.root_cause}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {fe.downtime_hours}h
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Zap className="h-3 w-3" />
                              {fe.production_loss_bbl} bbl
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Failure Mechanism</p>
                              <p>{fe.failure_mechanism}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Immediate Action</p>
                              <p>{fe.immediate_action}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Corrective Action</p>
                              <p>{fe.corrective_action}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Safety Impact</p>
                              <p>{fe.safety_impact}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                            <span>Detected by: {fe.detected_by}</span>
                            <span>Event ID: {fe.failure_event_id}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
