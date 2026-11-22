"use client";

import { useCallback, useRef } from "react";

import { BELL_HZ, CHIME_HZ } from "../config";

/** Reusable Web Audio chime and bell sounds for the lecturette module. */
export function useLecturetteAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const lastChimeRef = useRef(0);

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!contextRef.current) {
      if (typeof window.AudioContext !== "function") return null;
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  }, []);

  /**
   * Chime sound: 880 Hz sine with ~0.6s exponential decay.
   * If two chimes would overlap, the second is staggered by ~700ms.
   */
  const playChime = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    try {
      const now = performance.now();
      let startOffset = 0;
      if (now - lastChimeRef.current < 700) {
        startOffset = 0.7;
      }
      lastChimeRef.current = now + startOffset * 1000;

      const startAt = ctx.currentTime + startOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = CHIME_HZ;
      gain.gain.setValueAtTime(0.18, startAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.65);
    } catch {
      // Audio is nice-to-have; never break the UI.
    }
  }, [getContext]);

  /**
   * Bell sound: 660 Hz fundamental + overtones at 2.4x and 3.9x, ~1.6s decay.
   */
  const playBell = useCallback(() => {
    const ctx = getContext();
    if (!ctx) return;

    try {
      const startAt = ctx.currentTime;
      const fundamentals = [BELL_HZ, BELL_HZ * 2.4, BELL_HZ * 3.9];
      const volumes = [0.15, 0.06, 0.03];

      for (let i = 0; i < fundamentals.length; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = fundamentals[i];
        gain.gain.setValueAtTime(volumes[i], startAt);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + 1.65);
      }
    } catch {
      // Audio is nice-to-have.
    }
  }, [getContext]);

  return { playChime, playBell };
}
