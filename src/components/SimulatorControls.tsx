"use client";

import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

interface SensorDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const LABEL_MAP: Record<string, string> = {
  PRESSURE: "Pressure",
  LEVEL: "Level",
  TEMPERATURE: "Temperature",
  FLOW: "Flow",
  VIBRATION: "Vibration",
  CURRENT: "Current",
  LOAD: "Load",
  FREQUENCY: "Frequency",
  CONCENTRATION: "Concentration",
  SURGE_MARGIN: "Surge Margin",
};

function stepForRange(range: number): number {
  if (range < 5) return 0.01;
  if (range < 20) return 0.1;
  if (range < 100) return 0.5;
  return 1;
}

export function useAssetSensors(asset: string): SensorDef[] {
  const [defs, setDefs] = useState<SensorDef[]>([]);

  useEffect(() => {
    fetch(`/api/sensor-defs?asset=${encodeURIComponent(asset)}`)
      .then((r) => r.json())
      .then((data: SensorDef[]) => setDefs(data))
      .catch(() => setDefs([]));
  }, [asset]);

  return defs;
}

export function getDefaultValues(asset: string, defs?: SensorDef[]): Record<string, number> {
  if (defs && defs.length > 0) {
    const vals: Record<string, number> = {};
    for (const d of defs) vals[d.key] = d.defaultValue;
    return vals;
  }
  return {};
}

export function SimulatorControls({
  values,
  onChange,
  onAnalyze,
  loading,
  sensorDefs,
}: {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onAnalyze: () => void;
  loading: boolean;
  sensorDefs: SensorDef[];
}) {
  if (sensorDefs.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Loading sensor definitions...</p>;
  }

  return (
    <div className="space-y-5">
      {sensorDefs.map((def) => {
        const value = values[def.key] ?? def.defaultValue;

        return (
          <div key={def.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">
                {def.label}
              </label>
              <span className="text-sm font-mono">
                {value.toFixed(1)} <span className="text-xs text-muted-foreground">{def.unit}</span>
              </span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(v) => onChange(def.key, Array.isArray(v) ? v[0] : v)}
              min={def.min}
              max={def.max}
              step={def.step}
              className="w-full"
            />
          </div>
        );
      })}

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="w-full mt-4 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  );
}

export { LABEL_MAP, stepForRange };
export type { SensorDef };
