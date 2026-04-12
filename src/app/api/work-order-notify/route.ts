import { NextRequest, NextResponse } from "next/server";
import { isResendConfigured } from "@/lib/send-alert-email";

interface WorkOrderNotifyPayload {
  workOrderId: string;
  technicianName: string;
  technicianEmail: string;
  assetTag: string;
  assetName: string;
  priority: string;
  description: string;
  dueDate: string;
  notes?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "#dc2626";
    case "HIGH":
      return "#f59e0b";
    case "MEDIUM":
      return "#eab308";
    case "LOW":
      return "#22c55e";
    default:
      return "#6b7280";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkOrderNotifyPayload = await request.json();
    
    const {
      workOrderId,
      technicianName,
      technicianEmail,
      assetTag,
      assetName,
      priority,
      description,
      dueDate,
      notes,
    } = body;

    if (!workOrderId || !technicianEmail || !assetTag) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isResendConfigured()) {
      return NextResponse.json(
        { skipped: true, reason: "RESEND_API_KEY not configured" },
        { status: 200 }
      );
    }

    const key = process.env.RESEND_API_KEY;
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Industrial Copilot <onboarding@resend.dev>";

    const priorityColor = getPriorityColor(priority);
    const subject = `[Work Order ${workOrderId}] ${priority} - ${assetTag}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Work Order Assignment</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Industrial AI Copilot - North Sea Platform Alpha</p>
        </div>
        
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0 0 16px 0; color: #334155;">
            Hello <strong>${escapeHtml(technicianName)}</strong>,
          </p>
          
          <p style="margin: 0 0 24px 0; color: #334155;">
            A new work order has been assigned to you. Please review the details below and take appropriate action.
          </p>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Work Order ID</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; font-family: monospace; color: #0f172a;">${escapeHtml(workOrderId)}</p>
              </div>
              <div style="background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                ${escapeHtml(priority)}
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Equipment</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${escapeHtml(assetTag)}</p>
              <p style="margin: 2px 0 0 0; font-size: 14px; color: #64748b;">${escapeHtml(assetName)}</p>
            </div>
            
            <div style="margin-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Description</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155;">${escapeHtml(description)}</p>
            </div>
            
            <div style="margin-bottom: ${notes ? "16px" : "0"};">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">${formatDate(dueDate)}</p>
            </div>
            
            ${notes ? `
            <div>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Additional Notes</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155; font-style: italic;">${escapeHtml(notes)}</p>
            </div>
            ` : ""}
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Action Required:</strong> Please acknowledge receipt of this work order and begin work according to priority level.
            </p>
          </div>
          
          <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
            This is an automated notification from the Industrial AI Copilot system.<br/>
            This is demo/synthetic data for demonstration purposes.
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #64748b;">
            Industrial AI Copilot &copy; 2024 | North Sea Platform Alpha
          </p>
        </div>
      </div>
    `.trim();

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [technicianEmail],
          subject,
          html,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        id?: string;
      };

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: data.message || `Resend HTTP ${res.status}` },
          { status: 502 }
        );
      }

      return NextResponse.json({
        ok: true,
        emailId: data.id,
        recipient: technicianEmail,
      });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "Email send failed" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
