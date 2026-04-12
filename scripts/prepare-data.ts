import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";

const DATA_DIR = path.resolve(__dirname, "../../");
const OUT_DIR = path.resolve(__dirname, "../public/data");

function readCSV<T>(filename: string): T[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, filename), "utf-8");
  const result = Papa.parse<T>(raw, { header: true, skipEmptyLines: true });
  return result.data;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filepath: string, data: unknown) {
  ensureDir(path.dirname(filepath));
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  -> ${path.relative(path.resolve(__dirname, ".."), filepath)}`);
}

const TIMESERIES_ASSETS = [
  "AREA-HP-SEP:V-101",
  "AREA-HP-SEP:P-101",
  "AREA-WATER:E-301",
];

const TAG_MAP: Record<string, string> = {
  "AREA-HP-SEP:V-101": "V-101",
  "AREA-HP-SEP:P-101": "P-101",
  "AREA-WATER:E-301": "E-301",
};

// ── 1. Assets (ALL) ──────────────────────────────────────
function processAssets() {
  console.log("Processing assets (all)...");
  const rows = readCSV<Record<string, string>>("assets.csv");
  const equipment = rows.filter((r) => {
    const type = (r.type || "").toLowerCase();
    return !["facility", "area"].includes(type);
  });
  writeJSON(path.join(OUT_DIR, "assets.json"), equipment);
  console.log(`    ${equipment.length} equipment assets`);
}

// ── 2. Sensor Metadata (ALL) ─────────────────────────────
function processSensorMetadata() {
  console.log("Processing sensor metadata (all)...");
  const rows = readCSV<Record<string, string>>("sensor_metadata.csv");
  const parsed = rows.map((r) => ({
    ...r,
    normal_min: parseFloat(r.normal_min),
    normal_max: parseFloat(r.normal_max),
    alarm_low: parseFloat(r.alarm_low),
    alarm_high: parseFloat(r.alarm_high),
    trip_low: parseFloat(r.trip_low),
    trip_high: parseFloat(r.trip_high),
  }));
  writeJSON(path.join(OUT_DIR, "sensor-metadata.json"), parsed);
  console.log(`    ${parsed.length} sensors`);
}

// ── 3. Failure Events ─────────────────────────────────────
function processFailureEvents() {
  console.log("Processing failure events...");
  const rows = readCSV<Record<string, string>>("failure_events.csv");
  const cleaned = rows.map((r) => ({
    ...r,
    production_loss_bbl: parseFloat(r.production_loss_bbl || "0"),
    downtime_hours: parseFloat(r.downtime_hours || "0"),
  }));
  writeJSON(path.join(OUT_DIR, "failure-events.json"), cleaned);
}

// ── 4. Maintenance History ────────────────────────────────
function processMaintenanceHistory() {
  console.log("Processing maintenance history...");
  const rows = readCSV<Record<string, string>>("maintenance_history.csv");
  writeJSON(path.join(OUT_DIR, "maintenance-history.json"), rows);
}

// ── 5. Documents ──────────────────────────────────────────
function processDocuments() {
  console.log("Processing documents...");
  const rows = readCSV<Record<string, string>>("documents.csv");
  writeJSON(path.join(OUT_DIR, "documents.json"), rows);
}

// ── 6. Timeseries (per-asset, grouped by timestamp) ───────
interface GroupedReading {
  timestamp: string;
  sensors: Record<string, number>;
}

function processTimeseries() {
  console.log("Processing timeseries (this may take a moment)...");
  const raw = fs.readFileSync(path.join(DATA_DIR, "timeseries.csv"), "utf-8");

  const assetData: Record<string, Map<string, Record<string, number>>> = {};
  for (const id of TIMESERIES_ASSETS) {
    assetData[id] = new Map();
  }

  const lines = raw.split("\n");
  const header = lines[0].split(",");
  const tsIdx = header.indexOf("timestamp");
  const sensorIdx = header.indexOf("sensor_id");
  const assetIdx = header.indexOf("asset_id");
  const valueIdx = header.indexOf("value");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = line.split(",");
    const assetId = cols[assetIdx];
    if (!TIMESERIES_ASSETS.includes(assetId)) continue;

    const ts = cols[tsIdx];
    const sensorId = cols[sensorIdx];
    const value = parseFloat(cols[valueIdx]);
    const sensorKey = sensorId.replace(/^[A-Z]-\d+-/, "");

    const map = assetData[assetId];
    if (!map.has(ts)) map.set(ts, {});
    map.get(ts)![sensorKey] = Math.round(value * 1000) / 1000;
  }

  const tsDir = path.join(OUT_DIR, "timeseries");
  ensureDir(tsDir);

  for (const assetId of TIMESERIES_ASSETS) {
    const tag = TAG_MAP[assetId];
    const map = assetData[assetId];
    const readings: GroupedReading[] = [];

    const sortedTimestamps = Array.from(map.keys()).sort();
    for (const ts of sortedTimestamps) {
      readings.push({ timestamp: ts, sensors: map.get(ts)! });
    }

    writeJSON(path.join(tsDir, `${tag}.json`), readings);
    console.log(`    ${tag}: ${readings.length} timesteps`);
  }
}

// ── 7. Scenarios (focused windows around failure events) ──
function processScenarios() {
  console.log("Processing scenarios...");

  const scenarioDefs = [
    {
      name: "normal",
      asset: "V-101",
      start: "2025-10-04 07:00:00Z",
      end: "2025-10-11 07:00:00Z",
      description: "Stable baseline operation — V-101 HP Separator",
    },
    {
      name: "degrading",
      asset: "E-301",
      start: "2026-01-01 07:00:00Z",
      end: "2026-02-03 07:00:00Z",
      description: "Gradual HX fouling — E-301 temperature rise over 30 days",
    },
    {
      name: "failure",
      asset: "P-101",
      start: "2025-11-03 07:00:00Z",
      end: "2025-11-12 07:00:00Z",
      description: "Pump bearing failure — P-101 vibration spike",
    },
  ];

  const scenarioDir = path.join(OUT_DIR, "scenarios");
  ensureDir(scenarioDir);

  for (const def of scenarioDefs) {
    const tsFile = path.join(OUT_DIR, "timeseries", `${def.asset}.json`);
    if (!fs.existsSync(tsFile)) {
      console.log(`  Skipping ${def.name}: ${tsFile} not found`);
      continue;
    }

    const allData: GroupedReading[] = JSON.parse(
      fs.readFileSync(tsFile, "utf-8")
    );
    const filtered = allData.filter(
      (r) => r.timestamp >= def.start && r.timestamp <= def.end
    );

    writeJSON(path.join(scenarioDir, `${def.name}.json`), {
      ...def,
      dataPoints: filtered.length,
      data: filtered,
    });
    console.log(`    ${def.name}: ${filtered.length} points`);
  }
}

// ── Run all ───────────────────────────────────────────────
console.log("=== Data Preparation Pipeline ===\n");
processAssets();
processSensorMetadata();
processFailureEvents();
processMaintenanceHistory();
processDocuments();
processTimeseries();
processScenarios();
console.log("\n=== Done! ===");
