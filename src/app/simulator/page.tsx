"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useCriticalAlertNotify } from "@/hooks/useCriticalAlertNotify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SimulatorControls,
  useAssetSensors,
  getDefaultValues,
} from "@/components/SimulatorControls";
import { SimulatorResults } from "@/components/SimulatorResults";
import { ChatPanel } from "@/components/ChatPanel";
import type { AnalysisResult } from "@/lib/types";
import { Sliders, MessageSquare, AlertTriangle } from "lucide-react";

interface AssetOption {
  tag: string;
  name: string;
  area: string;
}

export default function SimulatorPage() {
  const [assetOptions, setAssetOptions] = useState<AssetOption[]>([]);
  const [asset, setAsset] = useState("V-101");
  const sensorDefs = useAssetSensors(asset);
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data: Record<string, { tag: string; name: string; sensorCount: number }[]>) => {
        const opts: AssetOption[] = [];
        for (const [area, assets] of Object.entries(data)) {
          for (const a of assets) {
            if (a.sensorCount > 0) {
              opts.push({ tag: a.tag, name: a.name, area });
            }
          }
        }
        opts.sort((a, b) => a.tag.localeCompare(b.tag));
        setAssetOptions(opts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sensorDefs.length > 0) {
      setValues(getDefaultValues(asset, sensorDefs));
    }
  }, [sensorDefs, asset]);

  const handleAssetChange = useCallback((newAsset: string) => {
    setAsset(newAsset);
    setResult(null);
  }, []);

  const handleValueChange = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, sensors: values }),
      });
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch {
      console.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [asset, values]);

  const isCritical = result?.overallStatus === "CRITICAL";
  const criticalTags = useMemo(
    () => (isCritical && result ? [asset] : []),
    [isCritical, result, asset]
  );
  useCriticalAlertNotify(isCritical, criticalTags, "simulator");
  const currentAssetName =
    assetOptions.find((a) => a.tag === asset)?.name || asset;

  return (
    <div className="space-y-6">
      {isCritical && (
        <div className="animate-pulse bg-red-600/20 border border-red-500/60 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-400">
              CRITICAL CONDITION DETECTED
            </p>
            <p className="text-xs text-red-300/80">
              <span className="font-mono font-bold">{asset}</span> ({currentAssetName})
              is in CRITICAL state based on current sensor inputs.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Interactive Simulator
        </h1>
        <p className="text-sm text-muted-foreground">
          Select any system, adjust sensor values, and test anomaly detection
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              Sensor Controls
            </CardTitle>
            <select
              value={asset}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="text-sm bg-background border border-border rounded-md px-3 py-1.5 outline-none mt-2"
            >
              {assetOptions.length > 0
                ? assetOptions.map((a) => (
                    <option key={a.tag} value={a.tag}>
                      {a.tag} — {a.name}
                    </option>
                  ))
                : (
                    <option value={asset}>{asset}</option>
                  )}
            </select>
          </CardHeader>
          <CardContent>
            <SimulatorControls
              values={values}
              onChange={handleValueChange}
              onAnalyze={handleAnalyze}
              loading={loading}
              sensorDefs={sensorDefs}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <SimulatorResults result={result} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-[400px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            AI Chat Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-3.5rem)]">
          <ChatPanel
            asset={asset}
            liveData={
              result
                ? {
                    [asset]: {
                      sensors: values,
                      analysis: result,
                    },
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
