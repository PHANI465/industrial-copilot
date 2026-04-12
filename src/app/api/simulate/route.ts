import { NextRequest, NextResponse } from "next/server";
import { getTimeseries, getScenario } from "@/lib/data-loader";
import { analyzeAnySensors, getOverallStatus } from "@/lib/anomaly-detector";
import { matchFailures } from "@/lib/failure-matcher";
import { getRecommendations } from "@/lib/recommender";
import { generateRandomFromMetadata } from "@/lib/random-generator";
import type { SimulateResponse } from "@/lib/types";
import * as fs from "fs";
import * as path from "path";

const REAL_ASSETS = new Set(["V-101", "P-101", "E-301"]);

function hasTimeseriesFile(assetTag: string): boolean {
  if (REAL_ASSETS.has(assetTag)) return true;
  const filepath = path.join(process.cwd(), "public", "data", "timeseries", `${assetTag}.json`);
  return fs.existsSync(filepath);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get("asset") || "V-101";
  const index = parseInt(searchParams.get("index") || "0", 10);
  const scenario = searchParams.get("scenario");

  try {
    if (scenario === "random" || !hasTimeseriesFile(asset)) {
      return handleRandom(asset, index);
    }

    if (scenario && ["normal", "degrading", "failure"].includes(scenario)) {
      const sc = getScenario(scenario);
      return handleData(asset, sc.data, index);
    }

    const data = getTimeseries(asset);
    return handleData(asset, data, index);
  } catch (error) {
    console.error("Simulate error:", error);
    return NextResponse.json(
      { error: "Failed to load simulation data" },
      { status: 500 }
    );
  }
}

function handleData(
  asset: string,
  data: { timestamp: string; sensors: Record<string, number> }[],
  index: number,
) {
  const total = data.length;
  const safeIndex = ((index % total) + total) % total;
  const point = data[safeIndex];

  const alerts = analyzeAnySensors(asset, point.sensors);
  const overallStatus = getOverallStatus(alerts);
  const failures = matchFailures(asset, alerts);
  const recommendations = getRecommendations(asset, alerts);

  const response: SimulateResponse = {
    index: safeIndex,
    total,
    timestamp: point.timestamp,
    sensors: point.sensors,
    analysis: { asset, overallStatus, alerts, failures, recommendations },
  };

  return NextResponse.json(response);
}

function handleRandom(asset: string, index: number) {
  const sensors = generateRandomFromMetadata(asset, index);
  const now = new Date();
  now.setMinutes(now.getMinutes() - (1000 - index));
  const timestamp = now.toISOString();

  const alerts = analyzeAnySensors(asset, sensors);
  const overallStatus = getOverallStatus(alerts);
  const failures = matchFailures(asset, alerts);
  const recommendations = getRecommendations(asset, alerts);

  const response: SimulateResponse = {
    index,
    total: 999999,
    timestamp,
    sensors,
    analysis: { asset, overallStatus, alerts, failures, recommendations },
  };

  return NextResponse.json(response);
}
