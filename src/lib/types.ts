export interface Asset {
  asset_id: string;
  tag: string;
  name: string;
  type: string;
  subtype: string;
  parent_id: string;
  area: string;
  location: string;
  manufacturer: string;
  model: string;
  install_date: string;
  status: string;
  criticality: string;
}

export interface SensorMeta {
  sensor_id: string;
  asset_id: string;
  tag: string;
  name: string;
  sensor_type: string;
  unit: string;
  normal_min: number;
  normal_max: number;
  alarm_low: number;
  alarm_high: number;
  trip_low: number;
  trip_high: number;
  area: string;
  location: string;
}

export interface GroupedReading {
  timestamp: string;
  sensors: Record<string, number>;
}

export interface Scenario {
  name: string;
  asset: string;
  start: string;
  end: string;
  description: string;
  dataPoints: number;
  data: GroupedReading[];
}

export type StatusLevel = "NORMAL" | "ADVISORY" | "WARNING" | "CRITICAL";

export interface AnomalyResult {
  sensorId: string;
  sensorType: string;
  status: StatusLevel;
  value: number;
  unit: string;
  reason: string;
  threshold?: number;
}

export interface FailureMatch {
  failureEventId: string;
  tag: string;
  failureMode: string;
  likelyCause: string;
  failureMechanism: string;
  confidence: number;
  correctiveAction: string;
  severity: string;
}

export interface FailureEvent {
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

export interface Recommendation {
  docId: string;
  title: string;
  relevantSection: string;
  actionSummary: string;
}

export interface DocRecord {
  doc_id: string;
  asset_id: string;
  doc_type: string;
  title: string;
  revision: string;
  author: string;
  approved_by: string;
  issue_date: string;
  content: string;
}

export interface AnalysisResult {
  asset: string;
  overallStatus: StatusLevel;
  alerts: AnomalyResult[];
  failures: FailureMatch[];
  recommendations: Recommendation[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export interface SimulateResponse {
  index: number;
  total: number;
  timestamp: string;
  sensors: Record<string, number>;
  analysis: AnalysisResult;
}
