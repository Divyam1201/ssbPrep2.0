"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LECTURETTE_DURATION_SECONDS } from "../config";
import type { ActiveTimer } from "../types";

const TICK_MS = 200;

export interface UseTimerStackReturn {
  timers: readonly ActiveTimer[];
  /** Start a new timer for the given topic. Replaces any existing timer. */
  startTimer: (topicId: string, topicName: string) => void;
  /** Reset a running timer to the full duration. */
  resetTimer: (timerId: string) => void;
  /** End (remove) a timer. */
  endTimer: (timerId: string) => void;
  /** True if the given topic currently has an active timer. */
  isTopicInUse: (topicId: string) => boolean;
  /** Get the remaining ms for a given timer. */
  getRemainingMs: (timerId: string) => number;
}

/**
 * Manages a stack of timestamp-based countdown timers.
 * Uses a single shared interval for all timers.
 * Timer IDs are the topic IDs.
 */
export function useTimerStack(
  onTimerEnd?: (timerId: string) => void,
): UseTimerStackReturn {
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const timersRef = useRef(timers);
  const onTimerEndRef = useRef(onTimerEnd);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  // Single shared tick interval
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.status === "running" && now >= t.endsAt) {
            changed = true;
            // Fire callback
            onTimerEndRef.current?.(t.id);
            return { ...t, status: "finished" as const };
          }
          return t;
        });
        return changed ? next : prev;
      });
    };

    const id = window.setInterval(tick, TICK_MS);
    const onVisChange = () => tick();
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, []);

  // Force re-render on ticks for the countdown display
  const [, setTick] = useState(0);
  useEffect(() => {
    const hasRunning = timers.some((t) => t.status === "running");
    if (!hasRunning) return;

    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [timers]);

  const startTimer = useCallback(
    (topicId: string, topicName: string) => {
      const durationMs = LECTURETTE_DURATION_SECONDS * 1000;
      const newTimer: ActiveTimer = {
        id: topicId,
        topicName,
        endsAt: Date.now() + durationMs,
        durationMs,
        status: "running",
      };

      setTimers((prev) => {
        // Remove existing timer for this topic if any
        const filtered = prev.filter((t) => t.id !== topicId);
        return [newTimer, ...filtered];
      });
    },
    [],
  );

  const resetTimer = useCallback((timerId: string) => {
    const durationMs = LECTURETTE_DURATION_SECONDS * 1000;
    setTimers((prev) =>
      prev.map((t) =>
        t.id === timerId
          ? { ...t, endsAt: Date.now() + durationMs, status: "running" as const }
          : t,
      ),
    );
  }, []);

  const endTimer = useCallback((timerId: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== timerId));
  }, []);

  const isTopicInUse = useCallback(
    (topicId: string) => {
      return timers.some((t) => t.id === topicId);
    },
    [timers],
  );

  const getRemainingMs = useCallback(
    (timerId: string) => {
      const timer = timers.find((t) => t.id === timerId);
      if (!timer) return 0;
      if (timer.status === "finished") return 0;
      return Math.max(0, timer.endsAt - Date.now());
    },
    [timers],
  );

  return { timers, startTimer, resetTimer, endTimer, isTopicInUse, getRemainingMs };
}
