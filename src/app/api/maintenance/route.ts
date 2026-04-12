import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

interface WorkOrder {
  work_order_id: string;
  failure_event_id: string;
  asset_id: string;
  tag: string;
  area: string;
  work_order_type: string;
  priority: string;
  status: string;
  raised_date: string;
  scheduled_date: string;
  completed_date: string;
  reported_by: string;
  assigned_to: string;
  supervisor: string;
  work_description: string;
  findings: string;
  actions_taken: string;
  parts_replaced: string;
  labor_hours: string;
  downtime_hours: string;
  production_loss_bbl: string;
  scenario_id: string;
}

let _cache: WorkOrder[] | null = null;

function loadData(): WorkOrder[] {
  if (_cache) return _cache;
  const filepath = path.join(process.cwd(), "public", "data", "maintenance-history.json");
  _cache = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  return _cache!;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const type = searchParams.get("type");

    let data = loadData();

    if (tag) data = data.filter((d) => d.tag === tag);
    if (type) data = data.filter((d) => d.work_order_type === type);

    data.sort((a, b) => b.raised_date.localeCompare(a.raised_date));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Maintenance error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
