import { NextRequest, NextResponse } from "next/server";
import { respondToChat, getRelevantDocContext } from "@/lib/chat-responder";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an AI operations assistant for the "Proactive AI Copilot for Industrial Operations" — a web-based monitoring and advisory dashboard for North Sea Platform Alpha, an offshore oil & gas production facility.

## ABOUT THIS APPLICATION
This is a demo/prototype web application that:
- Simulates real-time monitoring of industrial systems on the platform (up to ~90 equipment assets, 175 sensors)
- Uses historical time-series data (originally recorded at 15-minute intervals) replayed as fast-forward live data
- Detects anomalies using rule-based threshold checking against calibrated sensor metadata
- Matches detected anomalies to historical failure patterns for predictive insights
- Recommends corrective actions by searching SOPs, manuals, and inspection reports
- Provides this AI chat assistant (you!) that has access to both live sensor data and operational documentation

## YOUR ROLE
You are a versatile assistant. You should:
1. **Answer general questions naturally** — if someone asks "what is this?", "what does this app do?", or casual greetings, respond conversationally. Don't dump sensor data unless asked.
2. **Use live sensor data when relevant** — if asked about current status, errors, alerts, or "what's happening", reference the actual live values provided.
3. **Reference documentation when relevant** — cite SOPs and document IDs for procedures and troubleshooting.
4. **Be context-aware** — understand whether the user wants a general explanation, a technical deep-dive, or live status information.
5. **Remember conversation context** — refer to previous messages in the conversation when relevant.

## AVAILABLE DOCUMENTATION (11 documents)
SOPs: SOP-OPS-001 (V-101 Startup), SOP-OPS-002 (V-101 Shutdown), SOP-MAINT-001 (P-101 Lubrication/Vibration), SOP-MAINT-010 (E-301 Chemical Cleaning), SOP-SAFE-001 (ESD Response), SOP-OPS-010 (K-201 Startup After Trip), SOP-ENV-001 (PW Discharge Monitoring)
Manuals: MAN-MECH-001 (Sulzer Pump Bearings), MAN-INST-001 (Rosemount 3051 Pressure Transmitter)
References: PID-NPA-001 (HP Separation P&ID), RPT-INSPECT-001 (V-101 Inspection Report)

## KEY EQUIPMENT
- V-101: HP Production Separator — separates crude oil, gas, and produced water
- P-101: HP Separator Drain Pump — centrifugal pump draining V-101
- E-301: Produced Water Cooler — shell-and-tube heat exchanger
- K-201: LP Compressor — low-pressure gas compression
- P-303: Cooling Water Pump — platform cooling system
Plus ~85 more assets across HP Separation, LP Compression, Water Treatment, Utilities, and Metering & Export areas.

Be concise, practical, and safety-conscious. If you don't know something, say so.`;

function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!key && key !== "your-api-key-here" && key.length > 10;
}

interface LiveData {
  [asset: string]: {
    sensors: Record<string, number>;
    status: string;
    alerts: string[];
  };
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, asset, liveData, history } = body as {
      query: string;
      asset?: string;
      liveData?: LiveData;
      history?: HistoryMessage[];
    };

    if (!query) {
      return NextResponse.json(
        { error: "Missing 'query' in request body" },
        { status: 400 }
      );
    }

    if (isOpenAIConfigured()) {
      return handleOpenAIChat(query, asset, liveData, history);
    }

    const result = respondToChat(query, asset);
    return NextResponse.json({ ...result, mode: "keyword" });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    );
  }
}

function formatLiveData(liveData?: LiveData): string {
  if (!liveData || Object.keys(liveData).length === 0) {
    return "No live sensor data available at the moment.";
  }

  const parts: string[] = [];
  for (const [asset, data] of Object.entries(liveData)) {
    const sensorLines = Object.entries(data.sensors)
      .map(([key, val]) => `  ${key}: ${val}`)
      .join("\n");
    const alertLines = data.alerts.length > 0
      ? `  Active alerts: ${data.alerts.join("; ")}`
      : "  No active alerts";
    parts.push(`${asset} [Status: ${data.status}]\n${sensorLines}\n${alertLines}`);
  }

  return parts.join("\n\n");
}

async function handleOpenAIChat(
  query: string,
  asset?: string,
  liveData?: LiveData,
  history?: HistoryMessage[],
) {
  const { context, sources } = getRelevantDocContext(query, asset);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const liveSection = formatLiveData(liveData);

  const userMessage = [
    asset ? `[Current equipment focus: ${asset}]` : "",
    `\n== LIVE SENSOR DATA (for reference — only use if the question is about current status) ==\n${liveSection}`,
    `\n== USER QUESTION ==\n${query}`,
    context ? `\n== RELEVANT DOCUMENTATION ==\n${context}` : "",
  ].filter(Boolean).join("\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (history && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: userMessage });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 700,
    temperature: 0.4,
  });

  const response = completion.choices[0]?.message?.content || "I was unable to generate a response.";

  return NextResponse.json({ response, sources, mode: "openai" });
}
