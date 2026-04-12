"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Search, X, ChevronDown, Check } from "lucide-react";

const SENSOR_LABELS: Record<string, string> = {
  PRESS: "Pressure",
  SPRESS: "Suction Pressure",
  DPRESS: "Discharge Pressure",
  LEVEL: "Level",
  TEMP: "Temperature",
  DTEMP: "Discharge Temp",
  GAS_FLOW: "Gas Flow",
  OIL_FLOW: "Oil Flow",
  FLOW: "Flow",
  VIB: "Vibration",
  VIBDE: "Vibration (DE)",
  VIBNDE: "Vibration (NDE)",
  CURR: "Current",
  TINLET: "Inlet Temp",
  TOUTLET: "Outlet Temp",
  PSHELL: "Shell Pressure",
  SURGE: "Surge Margin",
  LOAD: "Load",
  FREQ: "Frequency",
  DPRES: "Diff Pressure",
  PV: "Process Value",
};

const COLOR_PALETTE = [
  "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#06b6d4", "#a855f7", "#14b8a6",
  "#e879f9", "#84cc16", "#fb923c", "#38bdf8", "#d946ef",
];

function formatLabel(key: string): string {
  return SENSOR_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface TrendPoint {
  timestamp?: string;
  sensors: Record<string, number>;
}

export function TrendChart({
  data,
  height,
}: {
  data: TrendPoint[];
  assetTag?: string;
  height?: number;
}) {
  const allSensorKeys = useMemo(() => {
    if (data.length === 0) return [];
    const keys = new Set<string>();
    for (const d of data) {
      for (const k of Object.keys(d.sensors)) keys.add(k);
    }
    return Array.from(keys);
  }, [data]);

  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-select all sensors when keys change (new asset selected)
  const prevKeysRef = useRef<string>("");
  useEffect(() => {
    const keySig = allSensorKeys.join(",");
    if (keySig !== prevKeysRef.current) {
      prevKeysRef.current = keySig;
      queueMicrotask(() => setSelectedSensors([...allSensorKeys]));
    }
  }, [allSensorKeys]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return allSensorKeys;
    const q = search.toLowerCase();
    return allSensorKeys.filter((k) =>
      k.toLowerCase().includes(q) || formatLabel(k).toLowerCase().includes(q)
    );
  }, [allSensorKeys, search]);

  const toggleSensor = (key: string) => {
    setSelectedSensors((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const activeSensors = selectedSensors.filter((k) => allSensorKeys.includes(k));

  if (data.length === 0) return null;

  const chartData = data.map((d, i) => ({
    index: i,
    time: d.timestamp
      ? new Date(d.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : `${i}`,
    ...d.sensors,
  }));

  return (
    <div className="space-y-2">
      {/* Sensor picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-accent transition-colors w-full sm:w-auto"
        >
          <Search className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {activeSensors.length === allSensorKeys.length
              ? `All sensors (${allSensorKeys.length})`
              : `${activeSensors.length} of ${allSensorKeys.length} sensors`}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 mt-1 w-72 bg-card border border-border rounded-lg shadow-xl">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/50 rounded-md">
                <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sensors..."
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1 px-2 py-1.5 border-b border-border">
              <button
                onClick={() => setSelectedSensors([...allSensorKeys])}
                className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-accent transition-colors"
              >
                All
              </button>
              <button
                onClick={() => setSelectedSensors([])}
                className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-accent transition-colors"
              >
                None
              </button>
            </div>

            {/* Sensor list */}
            <div className="max-h-48 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No sensors match</p>
              ) : (
                filteredOptions.map((key) => {
                  const isSelected = selectedSensors.includes(key);
                  const colorIndex = allSensorKeys.indexOf(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleSensor(key)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent transition-colors"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] }}
                      />
                      <span className="text-xs flex-1">{formatLabel(key)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{key}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected sensor chips */}
      {activeSensors.length > 0 && activeSensors.length < allSensorKeys.length && (
        <div className="flex flex-wrap gap-1">
          {activeSensors.map((key) => {
            const colorIndex = allSensorKeys.indexOf(key);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-border bg-accent/30"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] }}
                />
                {formatLabel(key)}
                <button
                  onClick={() => toggleSensor(key)}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Chart — explicit height avoids ResponsiveContainer -1 warnings on first paint */}
      <div className="w-full min-h-[200px]" style={{ height: height ?? 256 }}>
        {activeSensors.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Select at least one sensor to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height ?? 256}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#888" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10, fill: "#888" }} width={45} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,25,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              {activeSensors.map((key) => {
                const colorIndex = allSensorKeys.indexOf(key);
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={formatLabel(key)}
                    stroke={COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]}
                    dot={false}
                    strokeWidth={1.5}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
