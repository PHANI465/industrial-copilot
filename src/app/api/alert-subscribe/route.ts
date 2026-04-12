import { NextRequest, NextResponse } from "next/server";
import {
  addSubscription,
  getAllSubscriptions,
  isValidEmail,
  removeSubscriber,
} from "@/lib/alert-subscribers";
import { isResendConfigured } from "@/lib/send-alert-email";
import { getAssets } from "@/lib/data-loader";

export async function GET() {
  const assets = getAssets();
  const areas = [...new Set(assets.map((a) => a.area).filter(Boolean))].sort();
  const types = [...new Set(assets.map((a) => a.type).filter(Boolean))].sort();
  const tags = [...new Set(assets.map((a) => a.tag))].sort();

  const subs = getAllSubscriptions();
  return NextResponse.json({
    configured: isResendConfigured(),
    subscriberCount: subs.length,
    areas,
    types,
    tags,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const unsubscribe = body.unsubscribe === true;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    if (unsubscribe) {
      const r = removeSubscriber(email);
      if (!r.ok) {
        return NextResponse.json({ error: r.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Unsubscribed (saved list only; remove from env separately if used)" });
    }

    const tags = Array.isArray(body.tags) ? body.tags : [];
    const areas = Array.isArray(body.areas) ? body.areas : [];
    const types = Array.isArray(body.types) ? body.types : [];

    const r = addSubscription({
      email,
      tags: tags.filter((x: unknown): x is string => typeof x === "string"),
      areas: areas.filter((x: unknown): x is string => typeof x === "string"),
      types: types.filter((x: unknown): x is string => typeof x === "string"),
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      message: "Subscription saved",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
