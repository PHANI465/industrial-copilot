"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench, AlertTriangle, Clock, ChevronDown, ChevronUp,
  Filter, Calendar, Zap, Download, FileWarning,
  Bell, CheckCircle2, AlertCircle, Send, X, User, FileText,
  Plus, Mail, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useAlertStore, TECHNICIANS, type Alert, type WorkOrder, type Priority } from "@/lib/alert-store";

interface MaintenanceWorkOrder {
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

const ALERT_STATUS_COLORS: Record<string, string> = {
  NEW: "text-red-400 bg-red-500/15 border-red-500/30",
  ACKNOWLEDGED: "text-amber-400 bg-amber-500/15 border-amber-500/30",
  WORK_ORDER_CREATED: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  RESOLVED: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
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

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Work Order Creation Modal
function WorkOrderModal({
  alert,
  onClose,
  onSubmit,
}: {
  alert: Alert;
  onClose: () => void;
  onSubmit: (data: { assignedTo: string; priority: Priority; dueDate: string; notes: string }) => void;
}) {
  const [assignedTo, setAssignedTo] = useState(TECHNICIANS[0].id);
  const [priority, setPriority] = useState<Priority>(
    alert.severity === "CRITICAL" ? "CRITICAL" : alert.severity === "WARNING" ? "HIGH" : "MEDIUM"
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (priority === "CRITICAL" ? 1 : priority === "HIGH" ? 3 : 7));
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    onSubmit({ assignedTo, priority, dueDate, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-bold">Create Work Order</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Alert Info */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-1.5 py-0.5 rounded border ${ALERT_STATUS_COLORS[alert.severity] || ""}`}>
                {alert.severity}
              </span>
              <span className="font-mono text-sm font-bold">{alert.assetTag}</span>
            </div>
            <p className="text-sm text-muted-foreground">{alert.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {alert.sensorType}: {alert.value.toFixed(2)} {alert.unit} (threshold: {alert.threshold} {alert.unit})
            </p>
          </div>

          {/* Assign To */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {TECHNICIANS.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} - {tech.role}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Priority</label>
            <div className="flex gap-2">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    priority === p
                      ? PRIORITY_COLORS[p]
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional instructions or context..."
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? "Creating..." : "Create & Notify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [historicalWorkOrders, setHistoricalWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [failures, setFailures] = useState<FailureEvent[]>([]);
  const [tab, setTab] = useState<"alerts" | "workorders" | "maintenance" | "failures">("alerts");
  const [filterTag, setFilterTag] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedWO, setExpandedWO] = useState<string | null>(null);
  const [expandedFE, setExpandedFE] = useState<string | null>(null);
  const [timeseriesTags, setTimeseriesTags] = useState<string[]>([]);
  const [workOrderModal, setWorkOrderModal] = useState<Alert | null>(null);
  
  // Alert store
  const { 
    alerts, 
    workOrders, 
    acknowledgeAlert, 
    resolveAlert, 
    dismissAlert,
    createWorkOrder,
    markEmailSent,
    updateWorkOrderStatus,
  } = useAlertStore();

  useEffect(() => {
    fetch("/api/maintenance").then((r) => r.json()).then(setHistoricalWorkOrders).catch(() => {});
    fetch("/api/failures").then((r) => r.json()).then(setFailures).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/timeseries-tags")
      .then((r) => r.json())
      .then((d: { tags?: string[] }) => setTimeseriesTags(d.tags || []))
      .catch(() => setTimeseriesTags([]));
  }, []);

  const uniqueTags = [...new Set(historicalWorkOrders.map((w) => w.tag))].sort();
  const uniqueTypes = [...new Set(historicalWorkOrders.map((w) => w.work_order_type))].sort();

  const filteredWO = historicalWorkOrders.filter((w) => {
    if (filterTag && w.tag !== filterTag) return false;
    if (filterType && w.work_order_type !== filterType) return false;
    return true;
  });

  const totalDowntime = filteredWO.reduce((s, w) => s + parseFloat(w.downtime_hours || "0"), 0);
  const totalLoss = filteredWO.reduce((s, w) => s + parseFloat(w.production_loss_bbl || "0"), 0);
  
  const activeAlerts = alerts.filter((a) => a.status !== "RESOLVED");
  const newAlerts = alerts.filter((a) => a.status === "NEW");

  const handleCreateWorkOrder = async (alert: Alert, data: { assignedTo: string; priority: Priority; dueDate: string; notes: string }) => {
    const tech = TECHNICIANS.find((t) => t.id === data.assignedTo)!;
    
    const wo = createWorkOrder({
      alertId: alert.id,
      assetTag: alert.assetTag,
      assetName: alert.assetName,
      title: `${alert.severity} Alert: ${alert.sensorType} on ${alert.assetTag}`,
      description: alert.reason,
      priority: data.priority,
      assignedTo: data.assignedTo,
      assignedToEmail: tech.email,
      assignedToName: tech.name,
      dueDate: data.dueDate,
      notes: data.notes,
      recommendedAction: `Investigate ${alert.sensorType} reading of ${alert.value.toFixed(2)} ${alert.unit}. Threshold: ${alert.threshold} ${alert.unit}.`,
    });
    
    // Send email notification
    try {
      const res = await fetch("/api/work-order-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workOrderId: wo.id,
          technicianName: tech.name,
          technicianEmail: tech.email,
          assetTag: alert.assetTag,
          assetName: alert.assetName,
          priority: data.priority,
          description: alert.reason,
          dueDate: data.dueDate,
          notes: data.notes,
          sensorType: alert.sensorType,
        }),
      });
      
      if (res.ok) {
        markEmailSent(wo.id);
      }
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
    
    setWorkOrderModal(null);
  };

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
            <span className="text-xs font-mono text-primary tracking-wider">OPERATIONS CENTER</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Manage active alerts, create work orders, and browse maintenance history
          </p>
          

        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => setTab("alerts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "alerts"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className={`h-4 w-4 ${tab === "alerts" ? "text-red-400" : ""}`} />
          Active Alerts
          {newAlerts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
              {newAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("workorders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "workorders"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className={`h-4 w-4 ${tab === "workorders" ? "text-primary" : ""}`} />
          Work Orders
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tab === "workorders" 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          }`}>{workOrders.length}</span>
        </button>
        <button
          onClick={() => setTab("maintenance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "maintenance"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wrench className={`h-4 w-4 ${tab === "maintenance" ? "text-amber-400" : ""}`} />
          History
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tab === "maintenance" 
              ? "bg-amber-500/10 text-amber-400" 
              : "bg-muted text-muted-foreground"
          }`}>{historicalWorkOrders.length}</span>
        </button>
        <button
          onClick={() => setTab("failures")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "failures"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileWarning className={`h-4 w-4 ${tab === "failures" ? "text-red-400" : ""}`} />
          Failures
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tab === "failures" 
              ? "bg-red-500/10 text-red-400" 
              : "bg-muted text-muted-foreground"
          }`}>{failures.length}</span>
        </button>
      </div>

      {/* Active Alerts Tab */}
      {tab === "alerts" && (
        <div className="space-y-4">
          {activeAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-1">All Clear</h3>
                <p className="text-sm text-muted-foreground">No active alerts at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`overflow-hidden ${
                    alert.status === "NEW" ? "border-red-500/30 shadow-red-500/10 shadow-lg" : ""
                  }`}
                >
                  {alert.status === "NEW" && <div className="h-1 bg-red-500" />}
                  {alert.status === "ACKNOWLEDGED" && <div className="h-1 warning-stripes" />}
                  {alert.status === "WORK_ORDER_CREATED" && <div className="h-1 bg-blue-500" />}
                  
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Status LED */}
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className={`led ${
                          alert.status === "NEW" ? "led-red" :
                          alert.status === "ACKNOWLEDGED" ? "led-amber" :
                          "led-blue"
                        }`} />
                        <AlertCircle className={`h-5 w-5 ${
                          alert.severity === "CRITICAL" ? "text-red-400" :
                          alert.severity === "WARNING" ? "text-amber-400" :
                          "text-blue-400"
                        }`} />
                      </div>
                      
                      {/* Alert Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Link
                            href={`/assets/${alert.assetTag}`}
                            className="font-mono text-sm font-bold hover:text-primary transition-colors"
                          >
                            {alert.assetTag}
                          </Link>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${ALERT_STATUS_COLORS[alert.severity] || ""}`}>
                            {alert.severity}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${ALERT_STATUS_COLORS[alert.status] || ""}`}>
                            {alert.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">{timeAgo(alert.timestamp)}</span>
                        </div>
                        <p className="text-sm">{alert.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {alert.sensorType}: <span className="font-mono">{alert.value.toFixed(2)} {alert.unit}</span>
                          {" "}(threshold: {alert.threshold} {alert.unit})
                        </p>
                        
                        {alert.acknowledgedBy && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Acknowledged by {alert.acknowledgedBy} at {formatDateTime(alert.acknowledgedAt || "")}
                          </p>
                        )}
                        
                        {alert.workOrderId && (
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Work Order: {alert.workOrderId}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        {alert.status === "NEW" && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id, "Operator")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Acknowledge
                          </button>
                        )}
                        
                        {(alert.status === "NEW" || alert.status === "ACKNOWLEDGED") && (
                          <button
                            onClick={() => setWorkOrderModal(alert)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Work Order
                          </button>
                        )}
                        
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Resolve
                        </button>
                        
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Work Orders Tab */}
      {tab === "workorders" && (
        <div className="space-y-4">
          {workOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-1">No Work Orders</h3>
                <p className="text-sm text-muted-foreground">Create work orders from active alerts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workOrders.map((wo) => (
                <Card key={wo.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    wo.priority === "CRITICAL" ? "bg-red-500" :
                    wo.priority === "HIGH" ? "warning-stripes" :
                    wo.priority === "MEDIUM" ? "bg-yellow-500" :
                    "bg-emerald-500"
                  }`} />
                  
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-sm font-bold">{wo.id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[wo.priority] || ""}`}>
                            {wo.priority}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${
                            wo.status === "OPEN" ? "text-blue-400 bg-blue-500/15 border-blue-500/30" :
                            wo.status === "IN_PROGRESS" ? "text-amber-400 bg-amber-500/15 border-amber-500/30" :
                            wo.status === "COMPLETED" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" :
                            "text-muted-foreground bg-muted border-border"
                          }`}>
                            {wo.status.replace("_", " ")}
                          </span>
                          {wo.emailSent && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <Mail className="h-3 w-3" /> Notified
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium">{wo.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{wo.description}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {wo.assignedToName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(wo.dueDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created: {formatDateTime(wo.createdAt)}
                          </span>
                        </div>
                        
                        {wo.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Notes: {wo.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 shrink-0">
                        {wo.status === "OPEN" && (
                          <button
                            onClick={() => updateWorkOrderStatus(wo.id, "IN_PROGRESS")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                          >
                            Start Work
                          </button>
                        )}
                        {wo.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => updateWorkOrderStatus(wo.id, "COMPLETED")}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        <Link
                          href={`/assets/${wo.assetTag}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Asset
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance History Tab */}
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

      {/* Work Order Modal */}
      {workOrderModal && (
        <WorkOrderModal
          alert={workOrderModal}
          onClose={() => setWorkOrderModal(null)}
          onSubmit={(data) => handleCreateWorkOrder(workOrderModal, data)}
        />
      )}
    </div>
  );
}
