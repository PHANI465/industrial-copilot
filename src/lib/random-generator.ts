import { getSensorMetaForAsset } from "./data-loader";
import type { SensorMeta } from "./types";

function gaussianRandom(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function sensorKeyFromId(sensorId: string, assetTag: string): string {
  return sensorId.replace(`${assetTag}-`, "");
}

// Per-asset state persists across ticks for smooth transitions
const assetState: Record<string, Record<string, { value: number; momentum: number }>> = {};

export function generateRandomFromMetadata(
  assetTag: string,
  index: number,
): Record<string, number> {
  const metas = getSensorMetaForAsset(assetTag);
  if (metas.length === 0) return {};

  if (!assetState[assetTag]) {
    assetState[assetTag] = {};
    for (const meta of metas) {
      const key = sensorKeyFromId(meta.sensor_id, assetTag);
      const mid = (meta.normal_min + meta.normal_max) / 2;
      const range = meta.normal_max - meta.normal_min;
      assetState[assetTag][key] = {
        value: mid + (Math.random() - 0.5) * range * 0.2,
        momentum: 0,
      };
    }
  }

  const state = assetState[assetTag];
  const sensors: Record<string, number> = {};

  // Periodic anomaly windows using smooth sine
  const anomalyWave = Math.sin(index * 0.015) * 0.5 + 0.5;
  const inAnomaly = anomalyWave > 0.92;
  // Shared correlation factor so related sensors move together
  const sharedNoise = gaussianRandom(0, 1);

  for (const meta of metas) {
    const key = sensorKeyFromId(meta.sensor_id, assetTag);
    const mid = (meta.normal_min + meta.normal_max) / 2;
    const range = meta.normal_max - meta.normal_min;
    const s = state[key];

    let target: number;
    let noiseScale: number;

    if (inAnomaly && Math.random() > 0.4) {
      // Anomaly: drift toward alarm range
      target = Math.random() > 0.5
        ? meta.alarm_high - range * 0.1
        : (meta.alarm_low > 0 ? meta.alarm_low + range * 0.1 : mid);
      noiseScale = range * 0.04;
    } else {
      // Normal: slight oscillation around midpoint
      const cycleFactor = Math.sin(index * 0.03) * range * 0.08;
      target = mid + cycleFactor;
      noiseScale = range * 0.02;
    }

    // Correlated noise (30% shared, 70% individual)
    const correlatedNoise = sharedNoise * range * 0.008;
    const individualNoise = gaussianRandom(0, noiseScale);

    // Momentum for smooth transitions
    const pull = (target - s.value) * 0.03;
    s.momentum = s.momentum * 0.9 + pull + correlatedNoise + individualNoise;
    s.value += s.momentum;

    // Clamp within physical limits
    const lo = meta.trip_low > 0 ? meta.trip_low * 0.5 : 0;
    s.value = Math.max(lo, Math.min(meta.trip_high * 1.15, s.value));
    sensors[key] = Math.round(s.value * 1000) / 1000;
  }

  return sensors;
}

export function analyzeFromMetadata(
  assetTag: string,
  sensorValues: Record<string, number>,
): { sensorId: string; meta: SensorMeta; value: number; key: string }[] {
  const metas = getSensorMetaForAsset(assetTag);
  const pairs: { sensorId: string; meta: SensorMeta; value: number; key: string }[] = [];

  for (const meta of metas) {
    const key = sensorKeyFromId(meta.sensor_id, assetTag);
    if (key in sensorValues) {
      pairs.push({ sensorId: meta.sensor_id, meta, value: sensorValues[key], key });
    }
  }

  return pairs;
}
