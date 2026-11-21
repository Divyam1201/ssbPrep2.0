"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BEEP_VOLUME = 0.15;

export interface BeepOptions {
  /** Tone frequency in Hz. */
  frequency?: number;
  durationMs?: number;
}

export interface BeepControls {
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
  /** Play a short tone unless muted. Safe to call when audio is unavailable. */
  beep: (options?: BeepOptions) => void;
}

/**
 * Optional Web Audio beep with a mute toggle. The AudioContext is created
 * lazily on the first tone and released on unmount.
 */
export function useBeep(): BeepControls {
  const [muted, setMutedState] = useState(false);
  const mutedRef = useRef(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
    };
  }, []);

  const setMuted = useCallback((next: boolean) => {
    mutedRef.current = next;
    setMutedState(next);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted(!mutedRef.current);
  }, [setMuted]);

  const beep = useCallback(({ frequency = 880, durationMs = 160 }: BeepOptions = {}) => {
    if (mutedRef.current || typeof window === "undefined") return;

    try {
      let context = contextRef.current;
      if (!context) {
        if (typeof window.AudioContext !== "function") return;
        context = new window.AudioContext();
        contextRef.current = context;
      }
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
      }

      const startAt = context.currentTime;
      const endAt = startAt + durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(BEEP_VOLUME, startAt + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
    } catch {
      // Audio is a nice-to-have; never let it break the test.
    }
  }, []);

  return { muted, toggleMuted, setMuted, beep };
}
