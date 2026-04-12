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
  sensorType?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getPriorityColor(priority: string): string {
  switch (priority.toUpperCase()) {
    case "CRITICAL":
      return "#dc2626";
    case "HIGH":
      return "#ea580c";
    case "MEDIUM":
      return "#ca8a04";
    case "LOW":
      return "#16a34a";
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
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Work Order ID</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; font-family: monospace; color: #0f172a;">${escapeHtml(workOrderId)}</p>
              </div>
              <div style="background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;">
                ${escapeHtml(priority)}
              </div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Equipment Tag</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">${escapeHtml(assetTag)}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Equipment Name</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155;">${escapeHtml(assetName)}</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #0f172a;">${formatDate(dueDate)}</p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Issue Description</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155; line-height: 1.5;">${escapeHtml(description)}</p>
            </div>
            
            ${notes ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Additional Notes</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155; font-style: italic;">${escapeHtml(notes)}</p>
            </div>
            ` : ""}
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Important:</strong> Please acknowledge this work order within 2 hours of receipt and update the status once work begins.
            </p>
          </div>
          
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              This is an automated message from the Industrial AI Copilot system.
            </p>
          </div>
        </div>
      </div>
    `;

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

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Work Order Notify] Resend error:", errText);
      return NextResponse.json(
        { error: "Failed to send email", detail: errText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, workOrderId });
  } catch (err) {
    console.error("[Work Order Notify] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
