"use client";

import { useSyncExternalStore, useCallback } from "react";

// 5 Demo technicians (all same email for testing)
export const TECHNICIANS = [
  { id: "tech-1", name: "John Smith", email: "phanigavara465@gmail.com", role: "Senior Technician" },
  { id: "tech-2", name: "Sarah Johnson", email: "phanigavara465@gmail.com", role: "Maintenance Engineer" },
  { id: "tech-3", name: "Mike Williams", email: "phanigavara465@gmail.com", role: "Operations Technician" },
  { id: "tech-4", name: "Lisa Brown", email: "phanigavara465@gmail.com", role: "Instrumentation Specialist" },
  { id: "tech-5", name: "David Wilson", email: "phanigavara465@gmail.com", role: "Shift Supervisor" },
] as const;

export type AlertStatus = "NEW" | "ACKNOWLEDGED" | "WORK_ORDER_CREATED" | "RESOLVED";
export type WorkOrderStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface Alert {
  id: string;
  assetTag: string;
  assetName: string;
  sensorId: string;
  sensorType: string;
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  value: number;
  unit: string;
  threshold: number;
  reason: string;
  timestamp: string;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  workOrderId?: string;
}

export interface WorkOrder {
  id: string;
  alertId: string;
  assetTag: string;
  assetName: string;
  title: string;
  description: string;
  priority: Priority;
  assignedTo: string;
  assignedToEmail: string;
  assignedToName: string;
  status: WorkOrderStatus;
  createdAt: string;
  dueDate: string;
  notes: string;
  recommendedAction: string;
  emailSent: boolean;
}

interface AlertState {
  alerts: Alert[];
  workOrders: WorkOrder[];
}

const STORAGE_KEY = "industrial-copilot-alerts";

// Simple in-memory store with sessionStorage persistence
let state: AlertState = { alerts: [], workOrders: [] };
let listeners: Set<() => void> = new Set();

// Load from sessionStorage on init (client-side only)
function loadState(): AlertState {
  if (typeof window === "undefined") return { alerts: [], workOrders: [] };
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return { alerts: [], workOrders: [] };
}

function saveState(newState: AlertState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch {
    // Ignore errors
  }
}

function setState(newState: AlertState) {
  state = newState;
  saveState(newState);
  listeners.forEach((listener) => listener());
}

function getState(): AlertState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Server snapshot must be cached to avoid infinite loop
const serverSnapshot: AlertState = { alerts: [], workOrders: [] };
function getServerSnapshot(): AlertState {
  return serverSnapshot;
}

// Track if we've initialized from storage
let initialized = false;

function initializeState() {
  if (!initialized && typeof window !== "undefined") {
    state = loadState();
    initialized = true;
  }
}

// Hook to use the alert store
export function useAlertStore() {
  // Initialize on first use (client-side only)
  initializeState();
  
  const currentState = useSyncExternalStore(
    subscribe,
    getState,
    getServerSnapshot
  );

  const addAlert = useCallback((alertData: Omit<Alert, "id" | "status" | "timestamp">) => {
    const newAlert: Alert = {
      ...alertData,
      id: `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      status: "NEW",
      timestamp: new Date().toISOString(),
    };
    
    // Check if similar alert already exists (same asset + sensor within last 5 minutes)
    const existing = state.alerts.find(
      (a) =>
        a.assetTag === alertData.assetTag &&
        a.sensorId === alertData.sensorId &&
        a.status !== "RESOLVED" &&
        Date.now() - new Date(a.timestamp).getTime() < 5 * 60 * 1000
    );
    
    if (!existing) {
      setState({ ...state, alerts: [newAlert, ...state.alerts] });
    }
  }, []);

  const acknowledgeAlert = useCallback((alertId: string, acknowledgedBy: string) => {
    setState({
      ...state,
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: "ACKNOWLEDGED" as AlertStatus,
              acknowledgedBy,
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      ),
    });
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setState({
      ...state,
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: "RESOLVED" as AlertStatus } : a
      ),
    });
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState({
      ...state,
      alerts: state.alerts.filter((a) => a.id !== alertId),
    });
  }, []);

  const createWorkOrder = useCallback((workOrderData: Omit<WorkOrder, "id" | "status" | "createdAt" | "emailSent">) => {
    const newWorkOrder: WorkOrder = {
      ...workOrderData,
      id: `WO-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      emailSent: false,
    };
    
    setState({
      alerts: state.alerts.map((a) =>
        a.id === workOrderData.alertId
          ? { ...a, status: "WORK_ORDER_CREATED" as AlertStatus, workOrderId: newWorkOrder.id }
          : a
      ),
      workOrders: [newWorkOrder, ...state.workOrders],
    });
    
    return newWorkOrder;
  }, []);

  const updateWorkOrderStatus = useCallback((workOrderId: string, status: WorkOrderStatus) => {
    setState({
      ...state,
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId ? { ...wo, status } : wo
      ),
    });
  }, []);

  const markEmailSent = useCallback((workOrderId: string) => {
    setState({
      ...state,
      workOrders: state.workOrders.map((wo) =>
        wo.id === workOrderId ? { ...wo, emailSent: true } : wo
      ),
    });
  }, []);

  return {
    alerts: currentState.alerts,
    workOrders: currentState.workOrders,
    addAlert,
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,
    createWorkOrder,
    updateWorkOrderStatus,
    markEmailSent,
  };
}
