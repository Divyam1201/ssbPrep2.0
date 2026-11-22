"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBeep } from "@/core/audio/useBeep";
import { useCountdown } from "@/core/timer/useCountdown";
import type { PreparedSession } from "@/core/types";

import {
  CHIME_DURATION_MS,
  CHIME_FREQUENCY_HZ,
  WORD_DISPLAY_SECONDS,
} from "../config";

export interface UseWatSessionOptions {
  session: PreparedSession;
}

export type WatTestStatus = "instructions" | "running" | "paused" | "complete";

export interface WatSessionController {
  status: WatTestStatus;
  words: readonly string[];
  currentIndex: number;
  currentWord: string;
  totalWords: number;
  muted: boolean;
  toggleMuted: () => void;
  startTest: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  endTest: () => void;
  remainingMs: number;
  remainingSec: number;
  subscribeRemainingMs: (listener: (ms: number) => void) => () => void;
  getRemainingMs: () => number;
}

/**
 * Manages the WAT execution lifecycle.
 * Uses core `useCountdown` (timestamp-based, immune to background tab throttling)
 * and `useBeep` for audio chimes on each word change.
 */
export function useWatSession({
  session,
}: UseWatSessionOptions): WatSessionController {
  const [status, setStatus] = useState<WatTestStatus>("instructions");
  const [currentIndex, setCurrentIndex] = useState(0);
  const { muted, toggleMuted, beep } = useBeep();

  const words = useMemo(() => {
    return session.items.map((item) => item.label || item.id);
  }, [session.items]);

  const wordsRef = useRef(words);
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const currentIndexRef = useRef(currentIndex);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const playChime = useCallback(() => {
    beep({ frequency: CHIME_FREQUENCY_HZ, durationMs: CHIME_DURATION_MS });
  }, [beep]);

  const pausedRemainingMsRef = useRef<number>(WORD_DISPLAY_SECONDS * 1000);
  const handleWordCompleteRef = useRef<() => void>(() => {});

  const countdown = useCountdown({
    durationMs: WORD_DISPLAY_SECONDS * 1000,
    onComplete: () => handleWordCompleteRef.current(),
  });

  const { start: startCountdown, stop: stopCountdown, getRemainingMs, subscribe } =
    countdown;

  useEffect(() => {
    handleWordCompleteRef.current = () => {
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex < wordsRef.current.length) {
        setCurrentIndex(nextIndex);
        currentIndexRef.current = nextIndex;
        playChime();
        startCountdown(WORD_DISPLAY_SECONDS * 1000);
      } else {
        setStatus("complete");
      }
    };
  }, [playChime, startCountdown]);

  const startTest = useCallback(() => {
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setStatus("running");
    playChime();
    startCountdown(WORD_DISPLAY_SECONDS * 1000);
  }, [playChime, startCountdown]);

  const pause = useCallback(() => {
    setStatus((prev) => {
      if (prev !== "running") return prev;
      pausedRemainingMsRef.current = getRemainingMs();
      stopCountdown();
      return "paused";
    });
  }, [getRemainingMs, stopCountdown]);

  const resume = useCallback(() => {
    setStatus((prev) => {
      if (prev !== "paused") return prev;
      startCountdown(pausedRemainingMsRef.current);
      return "running";
    });
  }, [startCountdown]);

  const restart = useCallback(() => {
    stopCountdown();
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setStatus("running");
    playChime();
    startCountdown(WORD_DISPLAY_SECONDS * 1000);
  }, [playChime, startCountdown, stopCountdown]);

  const endTest = useCallback(() => {
    stopCountdown();
    setStatus("complete");
  }, [stopCountdown]);

  const currentWord = words[currentIndex] ?? "";
  const totalWords = words.length;

  return {
    status,
    words,
    currentIndex,
    currentWord,
    totalWords,
    muted,
    toggleMuted,
    startTest,
    pause,
    resume,
    restart,
    endTest,
    remainingMs: countdown.remainingMs,
    remainingSec: countdown.remainingSec,
    subscribeRemainingMs: subscribe,
    getRemainingMs,
  };
}
