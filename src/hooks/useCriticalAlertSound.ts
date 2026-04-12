"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Generates an industrial alarm sound using Web Audio API
 * Plays when critical alert is detected, with option to mute
 * NOTE: Sounds are OFF by default - user must enable them due to browser autoplay policy
 */
export function useCriticalAlertSound(isCritical: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const prevCriticalRef = useRef(false);
  const [isEnabled, setIsEnabled] = useState(false); // Sounds OFF by default
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Initialize audio context - requires user interaction first
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play factory lockdown siren - classic two-tone wailing siren
  const playAlarm = useCallback(() => {
    if (!isEnabled || isPlayingRef.current) return;
    
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      const duration = 4; // 4 second siren burst
      
      // Create master gain for overall volume control
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      
      // Primary siren oscillator - the main wailing tone
      const primaryOsc = ctx.createOscillator();
      const primaryGain = ctx.createGain();
      primaryOsc.type = "sawtooth"; // Harsh industrial tone
      primaryOsc.connect(primaryGain);
      primaryGain.connect(masterGain);
      primaryGain.gain.setValueAtTime(0.6, ctx.currentTime);
      
      // Secondary oscillator for thickness (slightly detuned)
      const secondaryOsc = ctx.createOscillator();
      const secondaryGain = ctx.createGain();
      secondaryOsc.type = "square"; // Adds body
      secondaryOsc.connect(secondaryGain);
      secondaryGain.connect(masterGain);
      secondaryGain.gain.setValueAtTime(0.25, ctx.currentTime);
      
      // Sub-bass for that chest-thumping factory feel
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subGain.gain.setValueAtTime(0.15, ctx.currentTime);
      
      // Factory lockdown siren: slow rise, hold, slow fall pattern
      // Classic "WHOOP-WHOOP" two-tone alternating pattern
      const lowFreq = 380;  // Low tone
      const highFreq = 620; // High tone
      const cycleTime = 0.8; // Time for each whoop
      const cycles = Math.floor(duration / cycleTime);
      
      // Start frequencies
      primaryOsc.frequency.setValueAtTime(lowFreq, ctx.currentTime);
      secondaryOsc.frequency.setValueAtTime(lowFreq * 0.5, ctx.currentTime);
      subOsc.frequency.setValueAtTime(lowFreq * 0.25, ctx.currentTime);
      
      // Create the alternating WHOOP pattern
      for (let i = 0; i < cycles; i++) {
        const cycleStart = ctx.currentTime + i * cycleTime;
        const isHigh = i % 2 === 0;
        const targetFreq = isHigh ? highFreq : lowFreq;
        const riseTime = cycleTime * 0.3;  // Quick rise
        const holdTime = cycleTime * 0.5;  // Hold the tone
        const fallTime = cycleTime * 0.2;  // Quick fall to next
        
        // Primary siren sweep
        primaryOsc.frequency.linearRampToValueAtTime(targetFreq, cycleStart + riseTime);
        primaryOsc.frequency.setValueAtTime(targetFreq, cycleStart + riseTime + holdTime);
        primaryOsc.frequency.linearRampToValueAtTime(
          isHigh ? lowFreq : highFreq, 
          cycleStart + cycleTime
        );
        
        // Secondary follows but slightly lower
        secondaryOsc.frequency.linearRampToValueAtTime(targetFreq * 0.5, cycleStart + riseTime);
        secondaryOsc.frequency.setValueAtTime(targetFreq * 0.5, cycleStart + riseTime + holdTime);
        
        // Sub follows the fundamental
        subOsc.frequency.linearRampToValueAtTime(targetFreq * 0.25, cycleStart + riseTime);
        
        // Pulse the volume slightly on each cycle for urgency
        primaryGain.gain.setValueAtTime(0.5, cycleStart);
        primaryGain.gain.linearRampToValueAtTime(0.7, cycleStart + riseTime);
        primaryGain.gain.linearRampToValueAtTime(0.5, cycleStart + cycleTime);
      }
      
      // Master volume envelope - fade in and out
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime + duration - 0.2);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      // Start all oscillators
      primaryOsc.start(ctx.currentTime);
      secondaryOsc.start(ctx.currentTime);
      subOsc.start(ctx.currentTime);
      
      primaryOsc.stop(ctx.currentTime + duration);
      secondaryOsc.stop(ctx.currentTime + duration);
      subOsc.stop(ctx.currentTime + duration);

      oscillatorRef.current = primaryOsc;
      gainNodeRef.current = masterGain;

      primaryOsc.onended = () => {
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
  }, [isEnabled, initAudio]);

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

  // Toggle sound enabled/disabled
  const toggleSound = useCallback(() => {
    setIsEnabled(prev => {
      if (prev) {
        // If disabling, stop current alarm
        stopAlarm();
      } else {
        // If enabling, initialize audio context (requires user click)
        setHasInteracted(true);
        initAudio();
      }
      return !prev;
    });
  }, [stopAlarm, initAudio]);

  // Test the siren sound - plays directly without checking isEnabled
  const testSound = useCallback(() => {
    if (isPlayingRef.current) return;
    
    setHasInteracted(true);
    
    try {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      const duration = 4;
      
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      
      const primaryOsc = ctx.createOscillator();
      const primaryGain = ctx.createGain();
      primaryOsc.type = "sawtooth";
      primaryOsc.connect(primaryGain);
      primaryGain.connect(masterGain);
      primaryGain.gain.setValueAtTime(0.6, ctx.currentTime);
      
      const secondaryOsc = ctx.createOscillator();
      const secondaryGain = ctx.createGain();
      secondaryOsc.type = "square";
      secondaryOsc.connect(secondaryGain);
      secondaryGain.connect(masterGain);
      secondaryGain.gain.setValueAtTime(0.25, ctx.currentTime);
      
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sine";
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subGain.gain.setValueAtTime(0.15, ctx.currentTime);
      
      const lowFreq = 380;
      const highFreq = 620;
      const cycleTime = 0.8;
      const cycles = Math.floor(duration / cycleTime);
      
      primaryOsc.frequency.setValueAtTime(lowFreq, ctx.currentTime);
      secondaryOsc.frequency.setValueAtTime(lowFreq * 0.5, ctx.currentTime);
      subOsc.frequency.setValueAtTime(lowFreq * 0.25, ctx.currentTime);
      
      for (let i = 0; i < cycles; i++) {
        const cycleStart = ctx.currentTime + i * cycleTime;
        const isHigh = i % 2 === 0;
        const targetFreq = isHigh ? highFreq : lowFreq;
        const riseTime = cycleTime * 0.3;
        const holdTime = cycleTime * 0.5;
        
        primaryOsc.frequency.linearRampToValueAtTime(targetFreq, cycleStart + riseTime);
        primaryOsc.frequency.setValueAtTime(targetFreq, cycleStart + riseTime + holdTime);
        primaryOsc.frequency.linearRampToValueAtTime(isHigh ? lowFreq : highFreq, cycleStart + cycleTime);
        
        secondaryOsc.frequency.linearRampToValueAtTime(targetFreq * 0.5, cycleStart + riseTime);
        secondaryOsc.frequency.setValueAtTime(targetFreq * 0.5, cycleStart + riseTime + holdTime);
        
        subOsc.frequency.linearRampToValueAtTime(targetFreq * 0.25, cycleStart + riseTime);
        
        primaryGain.gain.setValueAtTime(0.5, cycleStart);
        primaryGain.gain.linearRampToValueAtTime(0.7, cycleStart + riseTime);
        primaryGain.gain.linearRampToValueAtTime(0.5, cycleStart + cycleTime);
      }
      
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime + duration - 0.2);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      primaryOsc.start(ctx.currentTime);
      secondaryOsc.start(ctx.currentTime);
      subOsc.start(ctx.currentTime);
      
      primaryOsc.stop(ctx.currentTime + duration);
      secondaryOsc.stop(ctx.currentTime + duration);
      subOsc.stop(ctx.currentTime + duration);

      oscillatorRef.current = primaryOsc;
      gainNodeRef.current = masterGain;

      primaryOsc.onended = () => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };
    } catch (error) {
      console.error("[v0] Failed to play test sound:", error);
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, [initAudio]);

  // Play alarm when entering critical state
  useEffect(() => {
    const justBecameCritical = isCritical && !prevCriticalRef.current;
    prevCriticalRef.current = isCritical;

    if (justBecameCritical && isEnabled && hasInteracted) {
      const ctx = initAudio();
      if (ctx.state === "suspended") {
        ctx.resume().then(() => playAlarm());
      } else {
        playAlarm();
      }
    }
  }, [isCritical, isEnabled, hasInteracted, playAlarm, initAudio]);

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
    isEnabled,
    isPlaying,
    toggleSound,
    testSound,
    playAlarm,
    stopAlarm,
  };
}
