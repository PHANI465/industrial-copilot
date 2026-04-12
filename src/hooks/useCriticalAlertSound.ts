"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Generates an industrial alarm sound using Web Audio API
 * Plays when critical alert is detected, with option to mute
 */
export function useCriticalAlertSound(isCritical: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const prevCriticalRef = useRef(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play industrial alarm sound
  const playAlarm = useCallback(() => {
    if (isMuted || isPlayingRef.current) return;
    
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      // Create oscillator for alarm tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Industrial alarm pattern: alternating frequencies
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      
      // Create pulsing effect
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      
      const duration = 2; // 2 second alarm burst
      const pulseRate = 0.15; // 150ms per pulse
      
      for (let i = 0; i < duration / pulseRate; i++) {
        const time = ctx.currentTime + i * pulseRate;
        // Alternate between two frequencies for siren effect
        oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 600, time);
        // Pulse the volume
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.setValueAtTime(0.1, time + pulseRate * 0.5);
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);

      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      oscillator.onended = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };
    } catch (error) {
      console.error("[v0] Failed to play alarm sound:", error);
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [isMuted, initAudio]);

  // Stop the alarm
  const stopAlarm = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // If muting, stop current alarm
        stopAlarm();
      }
      return !prev;
    });
  }, [stopAlarm]);

  // Play alarm when entering critical state
  useEffect(() => {
    const justBecameCritical = isCritical && !prevCriticalRef.current;
    prevCriticalRef.current = isCritical;

    if (justBecameCritical && !isMuted) {
      playAlarm();
    }
  }, [isCritical, isMuted, playAlarm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAlarm]);

  return {
    isMuted,
    isPlaying,
    toggleMute,
    playAlarm,
    stopAlarm,
  };
}
