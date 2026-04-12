import * as fs from "fs";
import * as path from "path";
import type {
  Asset,
  SensorMeta,
  FailureEvent,
  DocRecord,
  GroupedReading,
  Scenario,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

function loadJSON<T>(filename: string): T {
  const filepath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filepath, "utf-8");
  return JSON.parse(raw) as T;
}

let _assets: Asset[] | null = null;
let _sensorMeta: SensorMeta[] | null = null;
let _failureEvents: FailureEvent[] | null = null;
let _documents: DocRecord[] | null = null;
const _timeseriesCache: Record<string, GroupedReading[]> = {};
const _scenarioCache: Record<string, Scenario> = {};

export function getAssets(): Asset[] {
  if (!_assets) _assets = loadJSON<Asset[]>("assets.json");
  return _assets;
}

export function getSensorMetadata(): SensorMeta[] {
  if (!_sensorMeta) _sensorMeta = loadJSON<SensorMeta[]>("sensor-metadata.json");
  return _sensorMeta;
}

export function getSensorMetaForAsset(assetTag: string): SensorMeta[] {
  return getSensorMetadata().filter((s) => s.tag.startsWith(assetTag + "/"));
}

export function getSensorMetaById(sensorId: string): SensorMeta | undefined {
  return getSensorMetadata().find((s) => s.sensor_id === sensorId);
}

export function getFailureEvents(): FailureEvent[] {
  if (!_failureEvents) _failureEvents = loadJSON<FailureEvent[]>("failure-events.json");
  return _failureEvents;
}

export function getDocuments(): DocRecord[] {
  if (!_documents) _documents = loadJSON<DocRecord[]>("documents.json");
  return _documents;
}

export function getTimeseries(assetTag: string): GroupedReading[] {
  if (_timeseriesCache[assetTag]) return _timeseriesCache[assetTag];
  const data = loadJSON<GroupedReading[]>(`timeseries/${assetTag}.json`);
  _timeseriesCache[assetTag] = data;
  return data;
}

export function getScenario(name: string): Scenario {
  if (_scenarioCache[name]) return _scenarioCache[name];
  const data = loadJSON<Scenario>(`scenarios/${name}.json`);
  _scenarioCache[name] = data;
  return data;
}
