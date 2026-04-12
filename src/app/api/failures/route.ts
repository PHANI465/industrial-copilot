import { NextResponse } from "next/server";
import { getFailureEvents } from "@/lib/data-loader";

export async function GET() {
  try {
    const events = getFailureEvents();
    const sorted = [...events].sort(
      (a, b) => b.event_timestamp.localeCompare(a.event_timestamp)
    );
    return NextResponse.json(sorted);
  } catch (error) {
    console.error("Failures error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
