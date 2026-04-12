export interface CriticalAlertPayload {
  assets: string[];
  source: string;
  detail?: string;
}

export function isResendConfigured(): boolean {
  const k = process.env.RESEND_API_KEY;
  return !!k && k.length > 8;
}

export async function sendCriticalAlertEmails(
  recipients: string[],
  payload: CriticalAlertPayload
): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  if (recipients.length === 0) {
    errors.push("No subscribers configured");
    return { sent: 0, errors };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    errors.push("RESEND_API_KEY is not set");
    return { sent: 0, errors };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Industrial Copilot <onboarding@resend.dev>";

  const subject = `[CRITICAL] Platform Alpha — ${payload.assets.join(", ")}`;
  const html = `
    <h2 style="color:#b91c1c">Critical condition</h2>
    <p><strong>System(s):</strong> ${payload.assets.map((a) => `<code>${a}</code>`).join(", ")}</p>
    <p><strong>Source:</strong> ${payload.source}</p>
    ${payload.detail ? `<p><strong>Detail:</strong> ${escapeHtml(payload.detail)}</p>` : ""}
    <p style="margin-top:1.5rem;font-size:12px;color:#666">Industrial AI Copilot — automated alert. This is demo/synthetic data.</p>
  `.trim();

  let sent = 0;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; id?: string };
    if (!res.ok) {
      errors.push(data.message || `Resend HTTP ${res.status}`);
      return { sent: 0, errors };
    }
    sent = recipients.length;
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Email send failed");
  }
  return { sent, errors };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
