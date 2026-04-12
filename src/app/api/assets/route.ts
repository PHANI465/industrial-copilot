import { NextResponse } from "next/server";
import { getAssets, getSensorMetadata } from "@/lib/data-loader";

export async function GET() {
  try {
    const assets = getAssets();
    const sensors = getSensorMetadata();

    const sensorCountByAsset: Record<string, number> = {};
    for (const s of sensors) {
      const tag = s.sensor_id.split("-").slice(0, 2).join("-");
      sensorCountByAsset[tag] = (sensorCountByAsset[tag] || 0) + 1;
    }

    const REAL_TIMESERIES = new Set(["V-101", "P-101", "E-301"]);

    const grouped: Record<string, {
      tag: string;
      name: string;
      type: string;
      subtype: string;
      area: string;
      criticality: string;
      sensorCount: number;
      dataSource: "timeseries" | "simulated";
    }[]> = {};

    for (const asset of assets) {
      const area = asset.area || "Other";
      if (!grouped[area]) grouped[area] = [];
      grouped[area].push({
        tag: asset.tag,
        name: asset.name,
        type: asset.type,
        subtype: asset.subtype,
        area: asset.area,
        criticality: asset.criticality,
        sensorCount: sensorCountByAsset[asset.tag] || 0,
        dataSource: REAL_TIMESERIES.has(asset.tag) ? "timeseries" : "simulated",
      });
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Assets error:", error);
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 });
  }
}
