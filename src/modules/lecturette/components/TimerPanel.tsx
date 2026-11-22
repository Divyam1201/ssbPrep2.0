"use client";

import { useState } from "react";

import type { ActiveTimer } from "../types";

interface TimerPanelProps {
  timers: readonly ActiveTimer[];
  getRemainingMs: (timerId: string) => number;
  onReset: (timerId: string) => void;
  onEnd: (timerId: string) => void;
  onManualBell: () => void;
}

export function TimerPanel({
  timers,
  getRemainingMs,
  onReset,
  onEnd,
  onManualBell,
}: TimerPanelProps) {
  const [ringingId, setRingingId] = useState<string | null>(null);

  if (timers.length === 0) return null;

  const handleBellClick = (timerId: string) => {
    onManualBell();
    setRingingId(timerId);
    setTimeout(() => {
      setRingingId((curr) => (curr === timerId ? null : curr));
    }, 600);
  };

  return (
    <aside
      aria-label="Active Lecturette Timers"
      className="pointer-events-none fixed top-4 right-4 z-40 flex max-h-[calc(100vh-2rem)] w-60 sm:w-72 max-w-[calc(100vw-2rem)] flex-col gap-2.5 overflow-y-auto"
    >
      {timers.map((timer) => {
        const remainingMs = getRemainingMs(timer.id);
        const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(
          seconds,
        ).padStart(2, "0")}`;

        const isFinished = timer.status === "finished" || totalSeconds === 0;
        const isRinging = ringingId === timer.id;

        return (
          <div
            key={timer.id}
            className={`pointer-events-auto rounded-2xl border p-3.5 shadow-xl transition-all duration-300 ${
              isFinished
                ? "animate-pulse border-red-500/50 bg-red-950/40 text-parchment"
                : "border-ink-border bg-ink-surface/95 text-parchment backdrop-blur-md"
            }`}
          >
            {/* Header: topic name + bell button */}
            <div className="flex items-start justify-between gap-2">
              <span
                title={timer.topicName}
                className="line-clamp-2 text-xs font-semibold leading-snug text-parchment"
              >
                {timer.topicName}
              </span>
              <button
                type="button"
                onClick={() => handleBellClick(timer.id)}
                title="Ring bell"
                aria-label={`Ring bell for ${timer.topicName}`}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ink-border bg-ink-muted text-xs transition hover:border-gold/50 hover:bg-gold/10 ${
                  isRinging ? "scale-110 text-gold rotate-12" : "text-parchment-dim"
                }`}
              >
                🔔
              </button>
            </div>

            {/* Countdown timer */}
            <div className="my-2.5 flex items-baseline justify-between">
              <span
                className={`font-mono text-2xl font-bold tracking-tight ${
                  isFinished ? "text-red-400" : "text-gold"
                }`}
              >
                {timeDisplay}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isFinished ? "text-red-400 font-bold" : "text-parchment-dim"
                }`}
              >
                {isFinished ? "Time's Up" : "Speaking"}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-ink-border/50">
              {isFinished ? (
                <>
                  <button
                    type="button"
                    onClick={() => onReset(timer.id)}
                    className="flex-1 rounded-xl bg-gold/15 border border-gold/30 px-2.5 py-1 text-center text-xs font-semibold text-gold transition hover:bg-gold/25"
                  >
                    Run again
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnd(timer.id)}
                    className="rounded-xl border border-ink-border bg-ink-muted px-2.5 py-1 text-xs font-medium text-parchment-dim transition hover:bg-ink-border hover:text-parchment"
                  >
                    End
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onReset(timer.id)}
                    className="flex-1 rounded-xl border border-ink-border bg-ink-muted px-2.5 py-1 text-center text-xs font-medium text-parchment transition hover:border-gold/40 hover:bg-ink-surface"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnd(timer.id)}
                    className="rounded-xl border border-ink-border bg-ink-muted px-2.5 py-1 text-xs font-medium text-parchment-dim transition hover:bg-ink-border hover:text-parchment"
                  >
                    End
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
