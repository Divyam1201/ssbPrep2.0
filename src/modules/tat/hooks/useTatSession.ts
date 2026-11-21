"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useBeep } from "@/core/audio/useBeep";
import { useObjectUrls } from "@/core/files/useObjectUrl";
import { useTestSession, type SessionStatus } from "@/core/session/useTestSession";
import { usePhaseSequence } from "@/core/timer/usePhaseSequence";
import type { PreparedSession } from "@/core/types";

import { WRITE_END_BEEP_HZ, WRITE_START_BEEP_HZ } from "../config";
import { buildTatPhases } from "../phases";

export type TatPhaseKind = "view" | "write";

export interface TatImage {
  id: string;
  /** Null while a freshly created object URL is being prepared. */
  src: string | null;
  alt: string;
}

export interface UseTatSessionOptions {
  session: PreparedSession;
  /** Start as soon as the runner mounts. Defaults to true. */
  autoStart?: boolean;
}

export interface TatSessionController {
  status: SessionStatus;
  images: readonly TatImage[];
  phaseKind: TatPhaseKind | null;
  currentIndex: number;
  currentSrc: string | null;
  /** Next image, preloaded while the current write phase is running. */
  nextSrc: string | null;
  isRunning: boolean;
  muted: boolean;
  toggleMuted: () => void;
  restart: () => void;
  endTest: () => void;
  /** Subscribe to remaining time ticks without triggering component re-renders. */
  subscribeRemainingMs: (listener: (ms: number) => void) => () => void;
  /** Current remaining milliseconds of the running phase. */
  getRemainingMs: () => number;
}

/**
 * Composes the core hooks (countdown -> phase sequence -> session state) with
 * the TAT phase list. All timing comes from the core; only TAT specifics
 * (images, beeps, per-image phases) live here.
 */
export function useTatSession({
  session,
  autoStart = true,
}: UseTatSessionOptions): TatSessionController {
  const {
    status,
    start: startSession,
    complete: completeSession,
    reset: resetSession,
  } = useTestSession();
  const { muted, toggleMuted, beep } = useBeep();

  const files = useMemo(
    () =>
      session.items.flatMap((item) => (item.file ? [item.file] : [])),
    [session.items],
  );
  const objectUrls = useObjectUrls(files);

  const images = useMemo<TatImage[]>(
    () =>
      session.items.map((item) => ({
        id: item.id,
        src: item.file
          ? (objectUrls.get(item.file) ?? null)
          : (item.src ?? null),
        alt: item.alt ?? item.label ?? "Practice image",
      })),
    [session.items, objectUrls],
  );

  const playWriteStart = useCallback(() => {
    beep({ frequency: WRITE_START_BEEP_HZ, durationMs: 180 });
  }, [beep]);

  const playWriteEnd = useCallback(() => {
    beep({ frequency: WRITE_END_BEEP_HZ, durationMs: 260 });
  }, [beep]);

  const phases = useMemo(
    () =>
      buildTatPhases(session.items, session.config, {
        onWriteStart: playWriteStart,
        onWriteEnd: playWriteEnd,
      }),
    [session.items, session.config, playWriteStart, playWriteEnd],
  );

  const {
    phase,
    index,
    isRunning,
    start: startSequence,
    stop: stopSequence,
    reset: resetSequence,
    subscribeRemainingMs,
    getRemainingMs,
  } = usePhaseSequence({ phases, onComplete: completeSession });

  const start = useCallback(() => {
    startSession();
    startSequence();
  }, [startSession, startSequence]);

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!autoStart || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    start();
  }, [autoStart, start]);

  const restart = useCallback(() => {
    resetSequence();
    resetSession();
    startSession();
    startSequence();
  }, [resetSequence, resetSession, startSession, startSequence]);

  const endTest = useCallback(() => {
    stopSequence();
    completeSession();
  }, [stopSequence, completeSession]);

  const phaseKind: TatPhaseKind | null =
    index < 0 ? null : index % 2 === 0 ? "view" : "write";
  const currentIndex = index < 0 ? 0 : Math.floor(index / 2);
  const currentSrc = images[currentIndex]?.src ?? null;
  const nextSrc =
    phaseKind === "write" ? (images[currentIndex + 1]?.src ?? null) : null;

  return {
    status,
    images,
    phaseKind: phase ? phaseKind : null,
    currentIndex,
    currentSrc,
    nextSrc,
    isRunning,
    muted,
    toggleMuted,
    restart,
    endTest,
    subscribeRemainingMs,
    getRemainingMs,
  };
}
