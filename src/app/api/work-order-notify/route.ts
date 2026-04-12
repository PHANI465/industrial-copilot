import { NextRequest, NextResponse } from "next/server";
import { isResendConfigured } from "@/lib/send-alert-email";
import { promises as fs } from "fs";
import path from "path";

interface FailureEvent {
  failure_event_id: string;
  asset_id: string;
  tag: string;
  area: string;
  event_timestamp: string;
  detected_by: string;
  severity: string;
  failure_mode: string;
  root_cause: string;
  failure_mechanism: string;
  immediate_action: string;
  corrective_action: string;
  production_loss_bbl: number;
  downtime_hours: number;
}

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

// Load historical failure events for similar equipment
async function getRelevantHistory(assetTag: string, sensorType?: string): Promise<FailureEvent[]> {
  try {
    const filePath = path.join(process.cwd(), "public/data/failure-events.json");
    const data = await fs.readFile(filePath, "utf-8");
    const events: FailureEvent[] = JSON.parse(data);
    
    // Get asset type from tag (e.g., P-101 -> "P" for pump)
    const assetPrefix = assetTag.split("-")[0];
    
    // Filter relevant events
    const relevant = events.filter((event) => {
      if (event.severity === "PLANNED") return false;
      
      // Same equipment
      if (event.tag === assetTag) return true;
      
      // Same equipment type (e.g., all pumps)
      if (event.tag.startsWith(assetPrefix + "-")) return true;
      
      return false;
    });
    
    // Sort by timestamp descending (most recent first)
    relevant.sort((a, b) => 
      new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime()
    );
    
    // Return up to 3 most relevant
    return relevant.slice(0, 3);
  } catch {
    return [];
  }
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
      sensorType,
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

    // Fetch relevant historical failures for this equipment type
    const historicalEvents = await getRelevantHistory(assetTag, sensorType);

    const key = process.env.RESEND_API_KEY;
    const from =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Industrial Copilot <onboarding@resend.dev>";

    const priorityColor = getPriorityColor(priority);
    const subject = `[Work Order ${workOrderId}] ${priority} - ${assetTag}`;
    
    // Build historical context section
    const historySection = historicalEvents.length > 0 ? `
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Historical Failure Reference
        </h3>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
          Similar equipment has experienced the following failures. This information may help diagnose and resolve the current issue:
        </p>
        ${historicalEvents.map((event, idx) => `
          <div style="background: ${idx === 0 ? '#fef3c7' : '#f8fafc'}; border: 1px solid ${idx === 0 ? '#f59e0b' : '#e2e8f0'}; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Event ID</span>
                <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: bold; font-family: monospace; color: #0f172a;">${escapeHtml(event.failure_event_id)}</p>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 11px; color: #64748b;">Equipment: </span>
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">${escapeHtml(event.tag)}</span>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${formatDate(event.event_timestamp)}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Failure Mode</span>
              <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #dc2626;">${escapeHtml(event.failure_mode)}</p>
            </div>
            
            <div style="margin-bottom: 10px;">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Root Cause</span>
              <p style="margin: 2px 0 0 0; font-size: 13px; color: #334155;">${escapeHtml(event.root_cause)}</p>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; padding: 12px; margin-top: 10px;">
              <span style="font-size: 11px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">How It Was Resolved</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #065f46;">${escapeHtml(event.corrective_action)}</p>
            </div>
            
            <div style="display: flex; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
              <div>
                <span style="font-size: 11px; color: #64748b;">Downtime: </span>
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">${event.downtime_hours}h</span>
              </div>
              <div>
                <span style="font-size: 11px; color: #64748b;">Production Loss: </span>
                <span style="font-size: 13px; font-weight: 600; color: #0f172a;">${event.production_loss_bbl} bbl</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

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
          
          ${historySection}
          
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
