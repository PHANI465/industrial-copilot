import type { AnomalyResult, Recommendation } from "./types";
import { getDocuments, getAssets } from "./data-loader";

const KEYWORD_MAP: Record<string, string[]> = {
  PRESSURE: ["pressure", "isolation", "valve", "impulse", "transmitter", "PSV"],
  TEMPERATURE: [
    "temperature",
    "cooler",
    "cleaning",
    "fouling",
    "heat",
    "thermal",
  ],
  VIBRATION: [
    "vibration",
    "bearing",
    "lubrication",
    "alignment",
    "ISO 10816",
  ],
  CURRENT: ["current", "motor", "overload", "bearing", "lubrication"],
  FLOW: ["flow", "valve", "blockage", "fouling", "strainer"],
  LEVEL: ["level", "separator", "control", "valve", "drain"],
  LOAD: ["load", "generator", "power", "electrical"],
  FREQUENCY: ["frequency", "generator", "speed", "synchronization"],
  CONCENTRATION: ["concentration", "oil-in-water", "discharge", "analyser"],
};

function extractRelevantSection(content: string, keywords: string[]): string {
  const lines = content.split("\n");
  let bestStart = 0;
  let bestScore = 0;

  for (let i = 0; i < lines.length; i++) {
    let score = 0;
    const windowEnd = Math.min(i + 8, lines.length);
    const window = lines.slice(i, windowEnd).join(" ").toLowerCase();

    for (const kw of keywords) {
      if (window.includes(kw.toLowerCase())) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  return lines
    .slice(bestStart, bestStart + 6)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

function summarizeAction(sensorType: string, status: string): string {
  const actions: Record<string, Record<string, string>> = {
    PRESSURE: {
      WARNING: "Verify pressure reading with field gauge. Check isolation valves and impulse lines.",
      CRITICAL: "IMMEDIATE: Isolate and depressurize. Check PSV operation. Evacuate area if gas release suspected.",
    },
    TEMPERATURE: {
      WARNING: "Monitor trend. Check cooling water flow and heat exchanger differential pressure.",
      CRITICAL: "Bypass equipment. Initiate chemical cleaning procedure per SOP.",
    },
    VIBRATION: {
      WARNING: "Schedule bearing inspection. Check lubrication levels and alignment.",
      CRITICAL: "IMMEDIATE: Trip pump and switch to standby. Inspect bearings for damage.",
    },
    CURRENT: {
      WARNING: "Check for mechanical binding. Verify motor load against design.",
      CRITICAL: "IMMEDIATE: Trip pump on overcurrent. Check bearings and coupling.",
    },
    FLOW: {
      WARNING: "Check strainer differential pressure. Verify control valve position.",
      CRITICAL: "Investigate blockage. Check upstream vessel levels.",
    },
    LEVEL: {
      WARNING: "Check level control valve operation. Verify level instrument calibration.",
      CRITICAL: "IMMEDIATE: Check drain pump operation. Verify no liquid carryover downstream.",
    },
    LOAD: {
      WARNING: "Check generator loading. Verify power distribution.",
      CRITICAL: "IMMEDIATE: Shed non-critical loads. Check generator protection systems.",
    },
    FREQUENCY: {
      WARNING: "Monitor generator speed governor. Check fuel supply.",
      CRITICAL: "IMMEDIATE: Switch to standby generator. Check synchronization equipment.",
    },
  };

  return (
    actions[sensorType]?.[status] ||
    `Investigate ${sensorType.toLowerCase()} anomaly. Refer to equipment SOP.`
  );
}

function resolveAssetId(tag: string): string | undefined {
  const assets = getAssets();
  const match = assets.find((a) => a.tag === tag);
  return match?.asset_id;
}

export function getRecommendations(
  assetTag: string,
  alerts: AnomalyResult[]
): Recommendation[] {
  const anomalies = alerts.filter((a) => a.status !== "NORMAL");
  if (anomalies.length === 0) return [];

  const docs = getDocuments();
  const assetId = resolveAssetId(assetTag);
  const results: Recommendation[] = [];
  const seenDocs = new Set<string>();

  for (const anomaly of anomalies) {
    const keywords = KEYWORD_MAP[anomaly.sensorType] || [
      anomaly.sensorType.toLowerCase(),
    ];

    const assetDocs = assetId ? docs.filter((d) => d.asset_id === assetId) : [];
    const allDocs = assetDocs.length > 0 ? assetDocs : docs;

    let bestDoc = allDocs[0];
    let bestScore = 0;

    for (const doc of allDocs) {
      if (seenDocs.has(doc.doc_id)) continue;
      const contentLower = (doc.content || "").toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (contentLower.includes(kw.toLowerCase())) score++;
      }
      if (assetId && doc.asset_id === assetId) score += 3;
      if (doc.doc_type === "SOP") score += 2;
      if (score > bestScore) {
        bestScore = score;
        bestDoc = doc;
      }
    }

    if (bestDoc && !seenDocs.has(bestDoc.doc_id)) {
      seenDocs.add(bestDoc.doc_id);
      results.push({
        docId: bestDoc.doc_id,
        title: bestDoc.title,
        relevantSection: extractRelevantSection(
          bestDoc.content || "",
          keywords
        ),
        actionSummary: summarizeAction(anomaly.sensorType, anomaly.status),
      });
    }
  }

  return results.slice(0, 3);
}
