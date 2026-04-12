import type { AnomalyResult, SensorMeta, StatusLevel } from "./types";
import { getSensorMetaForAsset } from "./data-loader";

export function detectAnomaly(
  sensorId: string,
  value: number,
  meta: SensorMeta
): AnomalyResult {
  const base = {
    sensorId,
    sensorType: meta.sensor_type,
    value,
    unit: meta.unit,
  };

  if (value >= meta.trip_high) {
    return {
      ...base,
      status: "CRITICAL",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} exceeds trip-high (${meta.trip_high})`,
      threshold: meta.trip_high,
    };
  }
  if (meta.trip_low > 0 && value <= meta.trip_low) {
    return {
      ...base,
      status: "CRITICAL",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} below trip-low (${meta.trip_low})`,
      threshold: meta.trip_low,
    };
  }
  if (value >= meta.alarm_high) {
    return {
      ...base,
      status: "WARNING",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} exceeds alarm-high (${meta.alarm_high})`,
      threshold: meta.alarm_high,
    };
  }
  if (meta.alarm_low > 0 && value <= meta.alarm_low) {
    return {
      ...base,
      status: "WARNING",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} below alarm-low (${meta.alarm_low})`,
      threshold: meta.alarm_low,
    };
  }
  if (value > meta.normal_max) {
    return {
      ...base,
      status: "ADVISORY",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} above normal range (>${meta.normal_max})`,
      threshold: meta.normal_max,
    };
  }
  if (value < meta.normal_min) {
    return {
      ...base,
      status: "ADVISORY",
      reason: `${meta.sensor_type} at ${value} ${meta.unit} below normal range (<${meta.normal_min})`,
      threshold: meta.normal_min,
    };
  }

  return {
    ...base,
    status: "NORMAL",
    reason: `${meta.sensor_type} within normal range`,
  };
}

const STATUS_PRIORITY: Record<StatusLevel, number> = {
  NORMAL: 0,
  ADVISORY: 1,
  WARNING: 2,
  CRITICAL: 3,
};

function sensorKeyFromId(sensorId: string, assetTag: string): string {
  return sensorId.replace(`${assetTag}-`, "");
}

export function analyzeAnySensors(
  assetTag: string,
  sensorValues: Record<string, number>
): AnomalyResult[] {
  const metas = getSensorMetaForAsset(assetTag);
  if (metas.length === 0) return [];

  const results: AnomalyResult[] = [];

  for (const meta of metas) {
    const key = sensorKeyFromId(meta.sensor_id, assetTag);
    if (!(key in sensorValues)) continue;
    results.push(detectAnomaly(meta.sensor_id, sensorValues[key], meta));
  }

  results.sort(
    (a, b) => STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status]
  );
  return results;
}

export function getOverallStatus(alerts: AnomalyResult[]): StatusLevel {
  let worst: StatusLevel = "NORMAL";
  for (const a of alerts) {
    if (STATUS_PRIORITY[a.status] > STATUS_PRIORITY[worst]) {
      worst = a.status;
    }
  }
  return worst;
}
