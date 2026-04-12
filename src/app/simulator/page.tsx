"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCriticalAlertNotify } from "@/hooks/useCriticalAlertNotify";
import { useCriticalAlertSound } from "@/hooks/useCriticalAlertSound";
import { SoundControl } from "@/components/SoundControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SimulatorControls,
  useAssetSensors,
  getDefaultValues,
} from "@/components/SimulatorControls";
import { SimulatorResults } from "@/components/SimulatorResults";
import { ChatPanel } from "@/components/ChatPanel";
import type { AnalysisResult } from "@/lib/types";
import { Sliders, MessageSquare, AlertTriangle, Cpu, FlaskConical } from "lucide-react";

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
  const { isMuted, isPlaying, toggleMute, stopAlarm } = useCriticalAlertSound(isCritical);
  const currentAssetName =
    assetOptions.find((a) => a.tag === asset)?.name || asset;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative -mx-4 sm:-mx-6 -mt-6 px-4 sm:px-6 pt-6 pb-8 mb-2 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/images/pump-equipment.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-mono text-primary tracking-wider">TESTING ENVIRONMENT</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Interactive Simulator
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Select any system, manually adjust sensor values, and test anomaly detection 
              algorithms in a safe sandbox environment
            </p>
          </div>
          <SoundControl 
            isMuted={isMuted}
            isPlaying={isPlaying}
            onToggleMute={toggleMute}
            onStopAlarm={stopAlarm}
          />
        </div>
      </div>

      {isCritical && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600/25 via-red-500/20 to-red-600/25 border border-red-500/50 rounded-xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-red-500/10">
          <div className="p-2.5 bg-red-500/20 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-400 tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              Critical Condition Detected
            </p>
            <p className="text-xs text-red-300/90 mt-0.5">
              <span className="font-mono font-bold text-red-200">{asset}</span> ({currentAssetName})
              is in CRITICAL state based on current sensor inputs
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sliders className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Sensor Controls</CardTitle>
                <p className="text-xs text-muted-foreground">Adjust values to test thresholds</p>
              </div>
            </div>
            <select
              value={asset}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="text-sm bg-muted/50 border border-border rounded-lg px-4 py-2 outline-none mt-3 w-full cursor-pointer hover:border-primary/30 transition-colors"
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

        <Card className="min-h-[400px] border-t-4 border-t-cyan-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Cpu className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-sm">Analysis Results</CardTitle>
                <p className="text-xs text-muted-foreground">Anomaly detection output</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SimulatorResults result={result} />
          </CardContent>
        </Card>
      </div>

      <Card className="h-[400px] border-t-4 border-t-emerald-500">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-sm">AI Chat Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Ask questions about the analysis</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[calc(100%-4.5rem)]">
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
