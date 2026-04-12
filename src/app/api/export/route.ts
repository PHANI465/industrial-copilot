import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

function loadJSON<T>(filename: string): T {
  const filepath = path.join(process.cwd(), "public", "data", filename);
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");

    let data: Record<string, unknown>[];
    let filename: string;

    switch (type) {
      case "maintenance": {
        data = loadJSON<Record<string, unknown>[]>("maintenance-history.json");
        if (tag) data = data.filter((d) => d.tag === tag);
        filename = tag ? `maintenance-${tag}.csv` : "maintenance-all.csv";
        break;
      }
      case "failures": {
        data = loadJSON<Record<string, unknown>[]>("failure-events.json");
        if (tag) data = data.filter((d) => d.tag === tag);
        filename = tag ? `failures-${tag}.csv` : "failures-all.csv";
        break;
      }
      case "sensors": {
        data = loadJSON<Record<string, unknown>[]>("sensor-metadata.json");
        if (tag) data = data.filter((d) => {
          const sTag = String(d.tag || "");
          return sTag.startsWith(tag + "/");
        });
        filename = tag ? `sensors-${tag}.csv` : "sensors-all.csv";
        break;
      }
      case "assets": {
        data = loadJSON<Record<string, unknown>[]>("assets.json");
        filename = "assets-all.csv";
        break;
      }
      case "timeseries": {
        if (!tag) {
          return NextResponse.json(
            { error: "timeseries export requires query tag=ASSET (e.g. V-101)" },
            { status: 400 }
          );
        }
        const filepath = path.join(process.cwd(), "public", "data", "timeseries", `${tag}.json`);
        if (!fs.existsSync(filepath)) {
          return NextResponse.json(
            { error: `No static time-series file for ${tag}` },
            { status: 404 }
          );
        }
        const series = loadJSON<Array<{ timestamp: string; sensors: Record<string, number> }>>(
          `timeseries/${tag}.json`
        );
        const sensorIds = new Set<string>();
        for (const row of series) {
          if (row.sensors) Object.keys(row.sensors).forEach((k) => sensorIds.add(k));
        }
        const sortedIds = [...sensorIds].sort();
        const rows: Record<string, unknown>[] = series.map((row) => {
          const o: Record<string, unknown> = { timestamp: row.timestamp };
          for (const id of sortedIds) {
            const v = row.sensors?.[id];
            o[id] = v === undefined ? "" : v;
          }
          return o;
        });
        const csv = toCSV(rows);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="timeseries-${tag}.csv"`,
          },
        });
      }
      default:
        return NextResponse.json(
          {
            error:
              "Invalid type. Use: maintenance, failures, sensors, assets, timeseries (timeseries needs tag=)",
          },
          { status: 400 }
        );
    }

    const csv = toCSV(data);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
