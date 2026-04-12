"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type Catalog = { areas: string[]; types: string[]; tags: string[] };

export function AlertEmailSubscribe() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [meta, setMeta] = useState<{
    configured: boolean;
    subscriberCount: number;
 } | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [scope, setScope] = useState<"all" | "custom">("all");
  const [selAreas, setSelAreas] = useState<string[]>([]);
  const [selTypes, setSelTypes] = useState<string[]>([]);
  const [selTags, setSelTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const refreshMeta = useCallback(() => {
    fetch("/api/alert-subscribe")
      .then((r) => r.json())
      .then((d) => {
        setMeta({
          configured: !!d.configured,
          subscriberCount: typeof d.subscriberCount === "number" ? d.subscriberCount : 0,
        });
        if (Array.isArray(d.areas) && Array.isArray(d.types) && Array.isArray(d.tags)) {
          setCatalog({
            areas: d.areas,
            types: d.types,
            tags: d.tags,
          });
        }
      })
      .catch(() => setMeta({ configured: false, subscriberCount: 0 }));
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  const filteredTags = useMemo(() => {
    if (!catalog) return [];
    const q = tagSearch.trim().toLowerCase();
    if (!q) return catalog.tags;
    return catalog.tags.filter(
      (t) => t.toLowerCase().includes(q) || t.toLowerCase().replace(/-/g, "").includes(q)
    );
  }, [catalog, tagSearch]);

  function toggle(list: string[], v: string, setList: (x: string[]) => void) {
    if (list.includes(v)) setList(list.filter((x) => x !== v));
    else setList([...list, v]);
  }

  async function subscribe() {
    setStatus("loading");
    setMsg("");
    try {
      const body: Record<string, unknown> = { email };
      if (scope === "custom") {
        body.tags = selTags;
        body.areas = selAreas;
        body.types = selTypes;
      }
      const res = await fetch("/api/alert-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("err");
        setMsg(data.error || "Request failed");
        return;
      }
      setStatus("ok");
      setMsg(
        scope === "all"
          ? "Subscribed to all CRITICAL alerts"
          : "Subscribed with filters (tag / area / type must match a critical asset)"
      );
      setEmail("");
      refreshMeta();
    } catch {
      setStatus("err");
      setMsg("Network error");
    }
  }

  async function unsubscribe() {
    if (!email.trim()) {
      setMsg("Enter the email to remove");
      setStatus("err");
      return;
    }
    setStatus("loading");
    setMsg("");
    try {
      const res = await fetch("/api/alert-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, unsubscribe: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("err");
        setMsg(data.error || "Request failed");
        return;
      }
      setStatus("ok");
      setMsg(data.message || "Unsubscribed");
      setEmail("");
      refreshMeta();
    } catch {
      setStatus("err");
      setMsg("Network error");
    }
  }

  const customSummary =
    scope === "custom"
      ? `${selTags.length} tags · ${selAreas.length} areas · ${selTypes.length} types`
      : "";

  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Mail className="h-4 w-4 text-cyan-400" />
        CRITICAL email alerts
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Choose <strong className="text-foreground/90">all equipment</strong> or limit by{" "}
        <strong className="text-foreground/90">asset tag</strong>, <strong className="text-foreground/90">area</strong>, or{" "}
        <strong className="text-foreground/90">equipment type</strong>. Filters combine with AND per asset (each axis you
        fill must match). Empty axes are ignored. Requires Resend on the server.
      </p>
      {meta && (
        <p className="text-[11px] text-muted-foreground">
          Email provider:{" "}
          {meta.configured ? (
            <span className="text-emerald-400">configured</span>
          ) : (
            <span className="text-amber-400">not configured — set RESEND_API_KEY</span>
          )}
          {meta.subscriberCount > 0 && (
            <span className="ml-2">· {meta.subscriberCount} saved rule(s)</span>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="alert-scope"
            checked={scope === "all"}
            onChange={() => setScope("all")}
            className="accent-primary"
          />
          All assets
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            name="alert-scope"
            checked={scope === "custom"}
            onChange={() => setScope("custom")}
            className="accent-primary"
          />
          Filtered {scope === "custom" && <span className="text-muted-foreground">({customSummary})</span>}
        </label>
      </div>

      {scope === "custom" && catalog && (
        <div className="border border-border/50 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-accent/30 hover:bg-accent/50"
          >
            {filtersOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Edit filters
          </button>
          {filtersOpen && (
            <div className="p-3 space-y-3 max-h-[280px] overflow-y-auto border-t border-border/40">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {catalog.areas.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggle(selAreas, a, setSelAreas)}
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        selAreas.includes(a)
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Equipment types</p>
                <div className="flex flex-wrap gap-1.5">
                  {catalog.types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(selTypes, t, setSelTypes)}
                      className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                        selTypes.includes(t)
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {t.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1">Asset tags</p>
                <input
                  type="search"
                  placeholder="Search tags…"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full text-xs bg-background border border-border rounded px-2 py-1 mb-1.5 outline-none"
                />
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {filteredTags.slice(0, 80).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggle(selTags, t, setSelTags)}
                      className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                        selTags.includes(t)
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-200"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {filteredTags.length > 80 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Narrow search — showing 80 of {filteredTags.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          className="flex-1 text-sm bg-background border border-border rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={subscribe}
            disabled={status === "loading"}
            className="text-sm px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Subscribe
          </button>
          <button
            type="button"
            onClick={unsubscribe}
            disabled={status === "loading"}
            className="text-sm px-3 py-2 rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            Unsubscribe
          </button>
        </div>
      </div>
      {scope === "custom" && selTags.length === 0 && selAreas.length === 0 && selTypes.length === 0 && (
        <p className="text-[10px] text-amber-400/90">
          Custom mode with no filters = same as &quot;All assets&quot;. Pick at least one filter or switch to All assets.
        </p>
      )}
      {msg && (
        <p className={`text-xs ${status === "err" ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>
      )}
    </div>
  );
}
