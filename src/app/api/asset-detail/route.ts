import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import {
  getAssets,
  getSensorMetaForAsset,
  getDocuments,
  getFailureEvents,
} from "@/lib/data-loader";

interface WorkOrder {
  work_order_id: string;
  tag: string;
  work_order_type: string;
  priority: string;
  status: string;
  raised_date: string;
  completed_date: string;
  work_description: string;
  findings: string;
  actions_taken: string;
  downtime_hours: string;
  production_loss_bbl: string;
}

let _woCache: WorkOrder[] | null = null;

function loadWorkOrders(): WorkOrder[] {
  if (_woCache) return _woCache;
  const filepath = path.join(process.cwd(), "public", "data", "maintenance-history.json");
  _woCache = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  return _woCache!;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    if (!tag) {
      return NextResponse.json({ error: "Missing tag" }, { status: 400 });
    }

    const assets = getAssets();
    const asset = assets.find((a) => a.tag === tag);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const sensors = getSensorMetaForAsset(tag);
    const docs = getDocuments().filter((d) => d.asset_id === asset.asset_id);
    const failures = getFailureEvents().filter((f) => f.tag === tag);
    const workOrders = loadWorkOrders()
      .filter((w) => w.tag === tag)
      .sort((a, b) => b.raised_date.localeCompare(a.raised_date));

    const REAL_TIMESERIES = new Set(["V-101", "P-101", "E-301"]);

    return NextResponse.json({
      asset,
      sensors,
      documents: docs,
      failures,
      workOrders,
      dataSource: REAL_TIMESERIES.has(tag) ? "timeseries" : "simulated",
    });
  } catch (error) {
    console.error("Asset detail error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
