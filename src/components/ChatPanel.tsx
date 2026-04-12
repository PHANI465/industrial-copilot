"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Sparkles, Search, Trash2 } from "lucide-react";
import type { ChatMessage, AnalysisResult } from "@/lib/types";

interface LiveDataPayload {
  [asset: string]: {
    sensors: Record<string, number>;
    status: string;
    alerts: string[];
  };
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I can answer questions about equipment operations, maintenance procedures, and troubleshooting. I have access to live sensor data and 11 operational documents — ask me anything!",
};

export function ChatPanel({
  asset,
  liveData,
}: {
  asset?: string;
  liveData?: Record<string, { sensors: Record<string, number>; analysis: AnalysisResult | null }>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<"unknown" | "openai" | "keyword">("unknown");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const buildLivePayload = (): LiveDataPayload | undefined => {
    if (!liveData) return undefined;

    const payload: LiveDataPayload = {};
    for (const [tag, data] of Object.entries(liveData)) {
      if (!data.analysis) continue;
      payload[tag] = {
        sensors: data.sensors,
        status: data.analysis.overallStatus,
        alerts: data.analysis.alerts
          .filter((a) => a.status !== "NORMAL")
          .map((a) => a.reason),
      };
    }
    return Object.keys(payload).length > 0 ? payload : undefined;
  };

  const buildHistory = (): { role: "user" | "assistant"; content: string }[] => {
    return messages
      .filter((m) => m !== WELCOME_MESSAGE)
      .map((m) => ({ role: m.role, content: m.content }));
  };

  const sendMessage = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          asset,
          liveData: buildLivePayload(),
          history: buildHistory(),
        }),
      });

      const data = await res.json();

      if (data.mode) setAiMode(data.mode);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "I could not find relevant information.",
          sources: data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setAiMode("unknown");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
        <Bot className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-medium">AI Assistant</span>
        {asset && (
          <span className="text-xs text-muted-foreground">
            Context: {asset}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {aiMode === "openai" && (
            <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> GPT
            </span>
          )}
          {aiMode === "keyword" && (
            <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Search className="h-3 w-3" /> Keyword
            </span>
          )}
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </div>
      {aiMode === "keyword" && (
        <p className="text-[10px] text-muted-foreground mb-2 -mt-1">
          Full GPT answers: set <code className="text-muted-foreground/90">OPENAI_API_KEY</code> in{" "}
          <code className="text-muted-foreground/90">.env.local</code> (never commit it).
        </p>
      )}

      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        <div className="space-y-3 pb-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <Bot className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-1 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Sources:</p>
                    {msg.sources.map((s, j) => (
                      <p key={j} className="text-xs text-muted-foreground">
                        • {s}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <Bot className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="bg-muted rounded-lg px-3 py-2">
                <span className="text-sm text-muted-foreground animate-pulse">
                  Thinking...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border mt-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask about equipment, procedures, or what's happening now..."
          className="text-sm"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
