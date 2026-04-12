"use client";

import { Volume2, VolumeX, Bell, BellOff } from "lucide-react";

interface SoundControlProps {
  isMuted: boolean;
  isPlaying: boolean;
  onToggleMute: () => void;
  onStopAlarm: () => void;
}

export function SoundControl({ 
  isMuted, 
  isPlaying, 
  onToggleMute,
  onStopAlarm 
}: SoundControlProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Stop alarm button - only visible when playing */}
      {isPlaying && (
        <button
          onClick={onStopAlarm}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all animate-pulse"
          title="Stop alarm"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Stop Alarm</span>
        </button>
      )}
      
      {/* Mute toggle */}
      <button
        onClick={onToggleMute}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          isMuted
            ? "bg-muted text-muted-foreground border-border hover:bg-accent"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        }`}
        title={isMuted ? "Unmute alerts" : "Mute alerts"}
      >
        {isMuted ? (
          <>
            <VolumeX className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Muted</span>
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sound On</span>
          </>
        )}
      </button>
    </div>
  );
}

// Compact version for header
export function SoundControlCompact({ 
  isMuted, 
  isPlaying, 
  onToggleMute,
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
      
      <button
        onClick={onToggleMute}
        className={`p-2 rounded-lg border transition-all ${
          isMuted
            ? "bg-muted/50 text-muted-foreground border-border hover:bg-accent"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
        }`}
        title={isMuted ? "Unmute critical alerts" : "Mute critical alerts"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
