"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Phase } from "@/core/types";

import { useCountdown } from "./useCountdown";

export interface UsePhaseSequenceOptions {
  phases: readonly Phase[];
  onComplete?: () => void;
}

export interface PhaseSequence {
  phase: Phase | null;
  /** Index of the current phase, or -1 before the sequence starts. */
  index: number;
  remainingMs: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  /** Stop where we are, keeping the current phase index. */
  stop: () => void;
  /** Stop and go back to "before the first phase". */
  reset: () => void;
  /** Subscribe to remaining time ticks (ms) without triggering parent re-renders. */
  subscribeRemainingMs: (listener: (remainingMs: number) => void) => () => void;
  /** Read current remaining time in ms. */
  getRemainingMs: () => number;
}

/**
 * Runs a list of phases in order, each for its own duration. Timing lives in
 * `useCountdown`; this hook only decides which phase is current and when the
 * sequence is finished.
 *
 * State changes are keyed by phase index, so re-rendering with a rebuilt
 * `phases` array will not restart the current phase.
 */
export function usePhaseSequence({
  phases,
  onComplete,
}: UsePhaseSequenceOptions): PhaseSequence {
  const [index, setIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [runToken, setRunToken] = useState(0);

  const phasesRef = useRef(phases);
  const indexRef = useRef(index);
  const startedPhaseRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    phasesRef.current = phases;
  }, [phases]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handlePhaseComplete = useCallback(() => {
    const list = phasesRef.current;
    const current = indexRef.current;
    const phase = current >= 0 ? list[current] : undefined;
    if (!phase) return;

    phase.onEnd?.();

    if (current + 1 < list.length) {
      indexRef.current = current + 1;
      setIndex(current + 1);
      return;
    }

    startedPhaseRef.current = null;
    setIsRunning(false);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, []);

  const countdown = useCountdown({
    durationMs: 0,
    onComplete: handlePhaseComplete,
  });
  const { start: startCountdown, stop: stopCountdown } = countdown;

  const phase = index >= 0 ? (phases[index] ?? null) : null;

  useEffect(() => {
    if (!isRunning || !phase) return;
    if (startedPhaseRef.current === index) return;

    startedPhaseRef.current = index;
    phase.onStart?.();
    startCountdown(phase.durationSec * 1000);
  }, [isRunning, index, phase, runToken, startCountdown]);

  const start = useCallback(() => {
    const list = phasesRef.current;
    if (list.length === 0) {
      setIsRunning(false);
      setIsComplete(true);
      onCompleteRef.current?.();
      return;
    }

    startedPhaseRef.current = null;
    indexRef.current = 0;
    setIndex(0);
    setIsComplete(false);
    setIsRunning(true);
    setRunToken((token) => token + 1);
  }, []);

  const stop = useCallback(() => {
    stopCountdown();
    setIsRunning(false);
  }, [stopCountdown]);

  const reset = useCallback(() => {
    stopCountdown();
    startedPhaseRef.current = null;
    indexRef.current = -1;
    setIndex(-1);
    setIsRunning(false);
    setIsComplete(false);
    // The run token is only bumped by `start`, so reset-then-start always
    // produces a new token and the first phase is guaranteed to run again.
  }, [stopCountdown]);

  const fallbackMs = phase ? phase.durationSec * 1000 : 0;

  const getRemainingMs = useCallback(() => {
    return countdown.isRunning ? countdown.getRemainingMs() : fallbackMs;
  }, [countdown, fallbackMs]);

  const subscribeRemainingMs = useCallback(
    (listener: (ms: number) => void) => {
      return countdown.subscribe(listener);
    },
    [countdown],
  );

  return {
    phase,
    index,
    remainingMs: countdown.isRunning ? countdown.remainingMs : fallbackMs,
    isRunning,
    isComplete,
    start,
    stop,
    reset,
    subscribeRemainingMs,
    getRemainingMs,
  };
}
