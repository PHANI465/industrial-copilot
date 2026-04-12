/**
 * Generate realistic synthetic time-series data for any or all assets.
 *
 * Usage:
 *   npx tsx scripts/generate-timeseries.ts                     # all assets with sensors
 *   npx tsx scripts/generate-timeseries.ts V-101 K-201 P-303   # specific assets only
 *   npx tsx scripts/generate-timeseries.ts --days 30           # 30 days of data (default: 7)
 *   npx tsx scripts/generate-timeseries.ts --interval 5        # 5-minute intervals (default: 15)
 *   npx tsx scripts/generate-timeseries.ts --scenario degrading K-201
 *
 * Scenarios:
 *   normal     - stable operations with day/night cycles and sensor correlations
 *   degrading  - gradual drift toward alarm over the full window
 *   failure    - normal -> warning -> trip in the last 20%
 *   random     - mostly normal with occasional multi-sensor anomaly events
 *   mixed      - combination: normal start, degrading middle, failure at end
 *
 * Output: public/data/timeseries/<tag>.json
 */

import * as fs from "fs";
import * as path from "path";

interface SensorMeta {
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
}

interface GroupedReading {
  timestamp: string;
  sensors: Record<string, number>;
}

const DATA_DIR = path.resolve(__dirname, "../public/data");

function loadJSON<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
}

function getSensorsForAsset(tag: string, allSensors: SensorMeta[]): SensorMeta[] {
  return allSensors.filter((s) => s.tag.startsWith(tag + "/"));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round(val: number, decimals = 3): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function gaussianNoise(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

type Scenario = "normal" | "degrading" | "failure" | "random" | "mixed";

// Sensors that tend to correlate positively with each other
const CORR_GROUPS: Record<string, string[][]> = {
  pump: [["FLOW", "CURR", "PRESS"], ["VIB", "VIBDE", "VIBNDE", "TEMP"]],
  compressor: [["FLOW", "DPRESS", "DTEMP"], ["VIBDE", "VIBNDE"], ["SPRESS"]],
  vessel: [["PRESS", "LEVEL"], ["TEMP", "GAS_FLOW", "OIL_FLOW"]],
  heat_exchanger: [["TINLET", "TOUTLET"], ["FLOW", "PSHELL"]],
};

function getAssetTypeFromTag(tag: string): string {
  const prefix = tag.split("-")[0];
  switch (prefix) {
    case "P": return "pump";
    case "K": return "compressor";
    case "V": return "vessel";
    case "E": return "heat_exchanger";
    default: return "generic";
  }
}

function generateForAsset(
  tag: string,
  sensors: SensorMeta[],
  totalPoints: number,
  intervalMinutes: number,
  scenario: Scenario,
): GroupedReading[] {
  const startDate = new Date("2025-10-01T00:00:00Z");
  const readings: GroupedReading[] = [];
  const assetType = getAssetTypeFromTag(tag);
  const corrGroups = CORR_GROUPS[assetType] || [sensors.map((s) => s.sensor_id.replace(`${tag}-`, ""))];

  // State for each sensor
  const state: Record<string, {
    value: number;
    meta: SensorMeta;
    key: string;
    momentum: number;
  }> = {};

  for (const meta of sensors) {
    const key = meta.sensor_id.replace(`${tag}-`, "");
    const mid = (meta.normal_min + meta.normal_max) / 2;
    const range = meta.normal_max - meta.normal_min;
    state[key] = {
      value: mid + (Math.random() - 0.5) * range * 0.2,
      meta,
      key,
      momentum: 0,
    };
  }

  // Anomaly event windows for "random" scenario
  const anomalyEvents: { start: number; end: number; intensity: number }[] = [];
  if (scenario === "random") {
    const numEvents = Math.floor(totalPoints / 200) + 1;
    for (let e = 0; e < numEvents; e++) {
      const eventStart = Math.floor(Math.random() * (totalPoints - 40));
      const duration = 15 + Math.floor(Math.random() * 30);
      anomalyEvents.push({
        start: eventStart,
        end: eventStart + duration,
        intensity: 0.3 + Math.random() * 0.7,
      });
    }
  }

  for (let i = 0; i < totalPoints; i++) {
    const progress = i / totalPoints;
    const ts = new Date(startDate.getTime() + i * intervalMinutes * 60 * 1000);

    // Day/night cycle (24-hour sine wave, peaking at 14:00)
    const hourOfDay = (ts.getUTCHours() + ts.getUTCMinutes() / 60);
    const dayNightFactor = Math.sin(((hourOfDay - 8) / 24) * 2 * Math.PI) * 0.5 + 0.5;

    // Weekly cycle (higher load weekdays)
    const dayOfWeek = ts.getUTCDay();
    const weekdayFactor = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.0 : 0.85;

    // Shared correlation noise (sensors in the same group move together)
    const groupNoise: Record<string, number> = {};
    for (const group of corrGroups) {
      const noise = gaussianNoise() * 0.4;
      for (const sensorKey of group) {
        groupNoise[sensorKey] = noise;
      }
    }

    // Check if we're in an anomaly event (for random scenario)
    let anomalyFactor = 0;
    for (const evt of anomalyEvents) {
      if (i >= evt.start && i <= evt.end) {
        const eventProgress = (i - evt.start) / (evt.end - evt.start);
        // Bell curve: ramp up then down
        anomalyFactor = Math.max(anomalyFactor,
          evt.intensity * Math.sin(eventProgress * Math.PI)
        );
      }
    }

    const sensorData: Record<string, number> = {};

    for (const key of Object.keys(state)) {
      const s = state[key];
      const { meta, value } = s;
      const range = meta.normal_max - meta.normal_min;
      const mid = (meta.normal_min + meta.normal_max) / 2;

      // Base target depends on scenario
      let target: number;
      let noiseScale: number;

      switch (scenario) {
        case "normal": {
          // Steady around mid, affected by day/night cycle
          const cycleOffset = (dayNightFactor - 0.5) * range * 0.15 * weekdayFactor;
          target = mid + cycleOffset;
          noiseScale = range * 0.02;
          break;
        }

        case "degrading": {
          // Slowly drift from normal toward alarm_high
          const degradeTarget = meta.normal_min + (meta.alarm_high - meta.normal_min) * Math.pow(progress, 0.8);
          const cycleOffset = (dayNightFactor - 0.5) * range * 0.1;
          target = degradeTarget + cycleOffset;
          noiseScale = range * 0.025 * (1 + progress * 0.5);
          break;
        }

        case "failure": {
          if (progress < 0.6) {
            const cycleOffset = (dayNightFactor - 0.5) * range * 0.12;
            target = mid + cycleOffset;
            noiseScale = range * 0.02;
          } else if (progress < 0.85) {
            // Warning phase: drift up with increasing noise
            const phaseProgress = (progress - 0.6) / 0.25;
            target = mid + (meta.alarm_high - mid) * phaseProgress * 0.8;
            noiseScale = range * 0.03 * (1 + phaseProgress);
          } else {
            // Trip phase: spike toward trip values
            const phaseProgress = (progress - 0.85) / 0.15;
            target = meta.alarm_high + (meta.trip_high - meta.alarm_high) * phaseProgress;
            noiseScale = range * 0.06;
          }
          break;
        }

        case "random": {
          const cycleOffset = (dayNightFactor - 0.5) * range * 0.12;
          target = mid + cycleOffset;
          if (anomalyFactor > 0) {
            const anomalyTarget = mid + (meta.alarm_high - mid) * anomalyFactor * 1.2;
            target = target * (1 - anomalyFactor) + anomalyTarget * anomalyFactor;
          }
          noiseScale = range * 0.025 * (1 + anomalyFactor);
          break;
        }

        case "mixed": {
          if (progress < 0.4) {
            // Normal phase
            const cycleOffset = (dayNightFactor - 0.5) * range * 0.15;
            target = mid + cycleOffset;
            noiseScale = range * 0.02;
          } else if (progress < 0.8) {
            // Degrading phase
            const phaseProgress = (progress - 0.4) / 0.4;
            const degradeTarget = mid + (meta.alarm_high - mid) * phaseProgress * 0.7;
            target = degradeTarget;
            noiseScale = range * 0.025 * (1 + phaseProgress * 0.3);
          } else {
            // Failure phase
            const phaseProgress = (progress - 0.8) / 0.2;
            target = meta.alarm_high + (meta.trip_high - meta.alarm_high) * phaseProgress * 0.8;
            noiseScale = range * 0.05;
          }
          break;
        }
      }

      // Apply correlated group noise + individual noise
      const corrNoise = (groupNoise[key] || 0) * range * 0.015;
      const individualNoise = gaussianNoise() * noiseScale;

      // Momentum (smooths out movements, prevents jerky changes)
      const pullStrength = 0.04;
      const momentumDecay = 0.92;
      s.momentum = s.momentum * momentumDecay + (target - value) * pullStrength + corrNoise + individualNoise;
      s.value = value + s.momentum;

      // Clamp within physical limits
      const lo = meta.trip_low > 0 ? meta.trip_low * 0.7 : 0;
      const hi = meta.trip_high * 1.15;
      s.value = clamp(s.value, lo, hi);

      sensorData[key] = round(s.value);
    }

    readings.push({
      timestamp: ts.toISOString().replace(".000Z", "Z"),
      sensors: sensorData,
    });
  }

  return readings;
}

// ── CLI parsing ──

const args = process.argv.slice(2);
let days = 7;
let intervalMinutes = 15;
let scenario: Scenario = "normal";
const requestedTags: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--days" && args[i + 1]) {
    days = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === "--interval" && args[i + 1]) {
    intervalMinutes = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === "--scenario" && args[i + 1]) {
    scenario = args[i + 1] as Scenario;
    i++;
  } else if (!args[i].startsWith("--")) {
    requestedTags.push(args[i]);
  }
}

const allSensors = loadJSON<SensorMeta[]>("sensor-metadata.json");
interface AssetRecord { tag: string; name: string }
const assets = loadJSON<AssetRecord[]>("assets.json");

let targetTags: string[];
if (requestedTags.length > 0) {
  targetTags = requestedTags;
} else {
  const tagsWithSensors = new Set<string>();
  for (const s of allSensors) {
    const tag = s.tag.split("/")[0];
    tagsWithSensors.add(tag);
  }
  targetTags = Array.from(tagsWithSensors).sort();
}

const totalPoints = Math.floor((days * 24 * 60) / intervalMinutes);

console.log("=== Realistic Synthetic Time-Series Generator ===");
console.log(`  Days: ${days}`);
console.log(`  Interval: ${intervalMinutes} min`);
console.log(`  Points per asset: ${totalPoints}`);
console.log(`  Scenario: ${scenario}`);
console.log(`  Assets: ${targetTags.length}`);
console.log(`  Features: day/night cycles, sensor correlations, momentum smoothing`);
console.log();

const outDir = path.join(DATA_DIR, "timeseries");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const tag of targetTags) {
  const sensors = getSensorsForAsset(tag, allSensors);
  if (sensors.length === 0) {
    console.log(`  ${tag}: skipped (no sensors)`);
    continue;
  }

  const data = generateForAsset(tag, sensors, totalPoints, intervalMinutes, scenario);
  const outFile = path.join(outDir, `${tag}.json`);
  fs.writeFileSync(outFile, JSON.stringify(data));
  const assetName = assets.find((a) => a.tag === tag)?.name || "";
  console.log(`  ${tag} (${assetName}): ${data.length} points, ${sensors.length} sensors -> ${path.basename(outFile)}`);
}

console.log("\nDone! Restart dev server to pick up new data.");
