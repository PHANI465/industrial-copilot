import { NextRequest, NextResponse } from "next/server";
import { getSensorMetaForAsset } from "@/lib/data-loader";

const LABEL_MAP: Record<string, string> = {
  PRESSURE: "Pressure",
  LEVEL: "Level",
  TEMPERATURE: "Temperature",
  FLOW: "Flow",
  VIBRATION: "Vibration",
  CURRENT: "Current",
  LOAD: "Load",
  FREQUENCY: "Frequency",
  CONCENTRATION: "Concentration",
  SURGE_MARGIN: "Surge Margin",
};

function stepForRange(range: number): number {
  if (range < 5) return 0.01;
  if (range < 20) return 0.1;
  if (range < 100) return 0.5;
  return 1;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get("asset");

  if (!asset) {
    return NextResponse.json({ error: "Missing asset" }, { status: 400 });
  }

  const metas = getSensorMetaForAsset(asset);

  const defs = metas.map((m) => {
    const key = m.sensor_id.replace(`${asset}-`, "");
    const range = m.trip_high - (m.trip_low > 0 ? m.trip_low : 0);
    const min = m.trip_low > 0 ? Math.floor(m.trip_low * 0.5) : 0;
    const max = Math.ceil(m.trip_high * 1.2);

    return {
      key,
      label: LABEL_MAP[m.sensor_type] || m.sensor_type,
      unit: m.unit,
      min,
      max,
      step: stepForRange(range),
      defaultValue: Math.round(((m.normal_min + m.normal_max) / 2) * 100) / 100,
    };
  });

  return NextResponse.json(defs);
}
