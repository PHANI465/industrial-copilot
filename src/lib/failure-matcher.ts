import type { AnomalyResult, FailureMatch } from "./types";
import { getFailureEvents, getAssets } from "./data-loader";

const SENSOR_TYPE_FAILURE_MAP: Record<string, string[]> = {
  VIBRATION: ["Bearing failure", "Pump mechanical seal failure"],
  PRESSURE: [
    "Process leak — export pipeline",
    "Instrument drift",
    "Compressor surge",
  ],
  TEMPERATURE: ["Heat exchanger fouling (gradual)", "Bearing failure"],
  CURRENT: ["Bearing failure", "Compressor surge"],
  FLOW: ["Heat exchanger fouling (gradual)", "Compressor surge"],
  LEVEL: ["Compressor surge"],
};

function getAssetType(tag: string): string {
  if (tag.startsWith("V-")) return "Vessel";
  if (tag.startsWith("P-")) return "Pump";
  if (tag.startsWith("E-")) return "HeatExchanger";
  if (tag.startsWith("K-")) return "Compressor";
  if (tag.startsWith("G-")) return "Generator";
  if (tag.startsWith("F-")) return "Vessel";
  if (tag.startsWith("FT-") || tag.startsWith("PT-") || tag.startsWith("LT-") || tag.startsWith("TT-") || tag.startsWith("VT-") || tag.startsWith("AT-")) return "Instrument";
  return "Unknown";
}

function resolveAssetId(tag: string): string | undefined {
  const assets = getAssets();
  const match = assets.find((a) => a.tag === tag);
  return match?.asset_id;
}

export function matchFailures(
  assetTag: string,
  alerts: AnomalyResult[]
): FailureMatch[] {
  const anomalies = alerts.filter((a) => a.status !== "NORMAL");
  if (anomalies.length === 0) return [];

  const events = getFailureEvents();
  const assetId = resolveAssetId(assetTag);
  const assetType = getAssetType(assetTag);
  const matches: FailureMatch[] = [];
  const seen = new Set<string>();

  for (const anomaly of anomalies) {
    const relatedModes = SENSOR_TYPE_FAILURE_MAP[anomaly.sensorType] || [];

    for (const event of events) {
      if (event.severity === "PLANNED") continue;
      if (seen.has(event.failure_event_id)) continue;

      let confidence = 0;

      if (
        assetId &&
        event.asset_id === assetId &&
        relatedModes.includes(event.failure_mode)
      ) {
        confidence = 0.92;
      } else if (
        getAssetType(event.tag) === assetType &&
        relatedModes.includes(event.failure_mode)
      ) {
        confidence = 0.72;
      } else if (relatedModes.includes(event.failure_mode)) {
        confidence = 0.45;
      }

      if (anomaly.status === "CRITICAL") confidence = Math.min(confidence + 0.05, 0.99);
      if (anomaly.status === "ADVISORY") confidence *= 0.7;

      if (confidence > 0.3) {
        seen.add(event.failure_event_id);
        matches.push({
          failureEventId: event.failure_event_id,
          tag: event.tag,
          failureMode: event.failure_mode,
          likelyCause: event.root_cause,
          failureMechanism: event.failure_mechanism,
          confidence: Math.round(confidence * 100) / 100,
          correctiveAction: event.corrective_action,
          severity: event.severity,
        });
      }
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  return matches.slice(0, 3);
}
