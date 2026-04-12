"use client";

import { Volume2, VolumeX, Bell, BellOff, Play } from "lucide-react";

interface SoundControlProps {
  isEnabled: boolean;
  isPlaying: boolean;
  onToggleSound: () => void;
  onTestSound: () => void;
  onStopAlarm: () => void;
}

export function SoundControl({ 
  isEnabled, 
  isPlaying, 
  onToggleSound,
  onTestSound,
  onStopAlarm 
}: SoundControlProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Stop alarm button - only visible when playing */}
      {isPlaying && (
        <button
          onClick={onStopAlarm}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all animate-pulse"
          title="Stop alarm"
        >
          <BellOff className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Stop</span>
        </button>
      )}
      
      {/* Test sound button */}
      {!isPlaying && (
        <button
          onClick={onTestSound}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-muted/50 text-muted-foreground border border-border hover:bg-accent hover:text-foreground transition-all"
          title="Test siren sound"
        >
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Test</span>
        </button>
      )}
      
      {/* Enable/disable toggle */}
      <button
        onClick={onToggleSound}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
          isEnabled
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
            : "bg-muted/50 text-muted-foreground border-border hover:bg-accent"
        }`}
        title={isEnabled ? "Disable alert sounds" : "Enable alert sounds"}
      >
        {isEnabled ? (
          <>
            <Volume2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sound On</span>
          </>
        ) : (
          <>
            <VolumeX className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sound Off</span>
          </>
        )}
      </button>
    </div>
  );
}

// Compact version for header
export function SoundControlCompact({ 
  isEnabled, 
  isPlaying, 
  onToggleSound,
  onTestSound,
  onStopAlarm 
}: SoundControlProps) {
  return (
    <div className="flex items-center gap-1">
      {isPlaying && (
        <button
          onClick={onStopAlarm}
          className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all animate-pulse"
          title="Stop alarm"
        >
          <BellOff className="h-4 w-4" />
        </button>
      )}
      
      {!isPlaying && (
        <button
          onClick={onTestSound}
          className="p-2 rounded-lg bg-muted/50 text-muted-foreground border border-border hover:bg-accent transition-all"
          title="Test siren sound"
        >
          <Play className="h-4 w-4" />
        </button>
      )}
      
      <button
        onClick={onToggleSound}
        className={`p-2 rounded-lg border transition-all ${
          isEnabled
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            : "bg-muted/50 text-muted-foreground border-border hover:bg-accent"
        }`}
        title={isEnabled ? "Disable critical alert sounds" : "Enable critical alert sounds"}
      >
        {isEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
