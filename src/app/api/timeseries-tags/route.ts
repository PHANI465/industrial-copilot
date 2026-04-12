import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "data", "timeseries");
  try {
    const names = fs.readdirSync(dir);
    const tags = names
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/i, ""));
    return NextResponse.json({ tags: tags.sort() });
  } catch {
    return NextResponse.json({ tags: [] });
  }
}
