"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How often the displayed remaining time is refreshed. */
const TICK_MS = 200;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export interface UseCountdownOptions {
  /** Default duration in milliseconds. */
  durationMs: number;
  /** Called exactly once per countdown when it reaches zero. */
  onComplete?: () => void;
}

export interface Countdown {
  remainingMs: number;
  /** Whole seconds left, rounded up (0 only when finished). */
  remainingSec: number;
  isRunning: boolean;
  /** Start, or restart with a new duration. */
  start: (durationMs?: number) => void;
  /** Cancel without firing `onComplete`. */
  stop: () => void;
  /** Subscribe to remaining time ticks (ms) without triggering parent re-renders. */
  subscribe: (listener: (remainingMs: number) => void) => () => void;
  /** Read current remaining time in ms. */
  getRemainingMs: () => number;
}

/**
 * Timestamp based countdown: it stores an absolute end time and derives the
 * remaining time from it on every tick, so throttled tabs and missed intervals
 * cannot make the countdown drift.
 */
export function useCountdown({
  durationMs,
  onComplete,
}: UseCountdownOptions): Countdown {
  const [endAt, setEndAt] = useState<number | null>(null);
  const durationRef = useRef(durationMs);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const endAtRef = useRef<number | null>(null);
  const listenersRef = useRef<Set<(remainingMs: number) => void>>(new Set());

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    endAtRef.current = endAt;
  }, [endAt]);

  const getRemainingMs = useCallback(() => {
    if (endAtRef.current === null) return 0;
    return Math.max(0, endAtRef.current - nowMs());
  }, []);

  const subscribe = useCallback(
    (listener: (remainingMs: number) => void) => {
      listenersRef.current.add(listener);
      listener(getRemainingMs());
      return () => {
        listenersRef.current.delete(listener);
      };
    },
    [getRemainingMs],
  );

  const start = useCallback((overrideMs?: number) => {
    const ms = Math.max(0, overrideMs ?? durationRef.current);
    durationRef.current = ms;
    completedRef.current = false;
    const targetEnd = nowMs() + ms;
    endAtRef.current = targetEnd;
    setEndAt(targetEnd);
    listenersRef.current.forEach((listener) => listener(ms));
  }, []);

  const stop = useCallback(() => {
    endAtRef.current = null;
    setEndAt(null);
    listenersRef.current.forEach((listener) => listener(0));
  }, []);

  useEffect(() => {
    if (endAt === null) return;
    // A countdown that already fired (possible with Strict Mode re-running this
    // effect) must not fire again.
    if (completedRef.current) return;

    const tick = () => {
      const left = Math.max(0, endAt - nowMs());
      listenersRef.current.forEach((listener) => listener(left));
      if (left <= 0 && !completedRef.current) {
        completedRef.current = true;
        endAtRef.current = null;
        setEndAt(null);
        onCompleteRef.current?.();
      }
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);
    const timeout = window.setTimeout(() => tick(), Math.max(0, endAt - nowMs()));
    const onVisibilityChange = () => tick();

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [endAt]);

  const currentRemainingMs = endAt !== null ? Math.max(0, endAt - nowMs()) : 0;

  return {
    remainingMs: currentRemainingMs,
    remainingSec: Math.ceil(currentRemainingMs / 1000),
    isRunning: endAt !== null,
    start,
    stop,
    subscribe,
    getRemainingMs,
  };
}
