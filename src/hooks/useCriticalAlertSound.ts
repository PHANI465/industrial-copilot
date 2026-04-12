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

  // Play industrial siren sound - rising/falling frequency sweep
  const playAlarm = useCallback(() => {
    if (isMuted || isPlayingRef.current) return;
    
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      // Create oscillator for siren tone
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Add slight distortion for more industrial feel
      const distortion = ctx.createWaveShaper();
      distortion.curve = makeDistortionCurve(20);
      
      oscillator.connect(distortion);
      distortion.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Siren uses sawtooth wave for harsh industrial sound
      oscillator.type = "sawtooth";
      
      const duration = 3; // 3 second siren burst
      const sirenCycles = 3; // Number of up/down cycles
      const cycleTime = duration / sirenCycles;
      
      // Low and high frequencies for siren sweep
      const lowFreq = 400;
      const highFreq = 900;
      
      // Create smooth siren sweep
      oscillator.frequency.setValueAtTime(lowFreq, ctx.currentTime);
      
      for (let i = 0; i < sirenCycles; i++) {
        const cycleStart = ctx.currentTime + i * cycleTime;
        // Rise
        oscillator.frequency.linearRampToValueAtTime(highFreq, cycleStart + cycleTime * 0.5);
        // Fall
        oscillator.frequency.linearRampToValueAtTime(lowFreq, cycleStart + cycleTime);
      }
      
      // Volume envelope - slight fade in/out
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime + duration - 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

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
  
  // Create distortion curve for industrial harshness
  function makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

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
