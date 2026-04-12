import { NextRequest, NextResponse } from "next/server";
import { getRecipientsForCriticalAssets } from "@/lib/alert-subscribers";
import { shouldSendAlert } from "@/lib/alert-notify-throttle";
import { sendCriticalAlertEmails, isResendConfigured } from "@/lib/send-alert-email";
import { getAssets } from "@/lib/data-loader";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assets = Array.isArray(body.assets)
      ? body.assets.filter((a: unknown): a is string => typeof a === "string" && a.length > 0)
      : [];
    const source = typeof body.source === "string" ? body.source : "dashboard";
    const detail = typeof body.detail === "string" ? body.detail : undefined;

    if (assets.length === 0) {
      return NextResponse.json({ error: "assets[] required" }, { status: 400 });
    }

    if (!isResendConfigured()) {
      return NextResponse.json(
        { skipped: true, reason: "RESEND_API_KEY not configured" },
        { status: 200 }
      );
    }

    const allAssets = getAssets();
    const recipients = getRecipientsForCriticalAssets(assets, allAssets);
    if (recipients.length === 0) {
      return NextResponse.json({
        skipped: true,
        reason: "No subscribers matched these assets (check filters / ALERT_SUBSCRIBER_RULES)",
      });
    }

    const signature = [...assets].sort().join(",");
    if (!shouldSendAlert(signature)) {
      return NextResponse.json({
        skipped: true,
        reason: "Throttled (same CRITICAL set emailed within 10 minutes)",
      });
    }

    const result = await sendCriticalAlertEmails(recipients, {
      assets,
      source,
      detail,
    });

    if (result.sent === 0 && result.errors.length > 0) {
      return NextResponse.json({ ok: false, errors: result.errors }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      recipients: recipients.length,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
