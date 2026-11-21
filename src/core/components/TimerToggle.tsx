"use client";

import { useEffect, useState } from "react";

/**
 * Format remaining milliseconds to `m:ss` (e.g. `3:47`, `0:09`).
 * Seconds are rounded up so 0 only shows when completely finished.
 */
export function formatRemainingTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface TimerToggleProps {
  /** Optional static or externally managed remaining milliseconds. */
  remainingMs?: number;
  /** Subscribe to remaining time updates without re-rendering parent components. */
  subscribeRemainingMs?: (listener: (remainingMs: number) => void) => () => void;
  /** Read the current remaining time on demand. */
  getRemainingMs?: () => number;
  className?: string;
}

interface TimerPillProps {
  remainingMs?: number;
  subscribeRemainingMs?: (listener: (remainingMs: number) => void) => () => void;
  getRemainingMs?: () => number;
}

function TimerPill({
  remainingMs: directRemainingMs,
  subscribeRemainingMs,
  getRemainingMs,
}: TimerPillProps) {
  const [subscribedMs, setSubscribedMs] = useState<number>(() => {
    if (getRemainingMs) return getRemainingMs();
    return 0;
  });

  useEffect(() => {
    if (!subscribeRemainingMs) return;

    const unsubscribe = subscribeRemainingMs((newMs) => {
      setSubscribedMs(newMs);
    });

    return unsubscribe;
  }, [subscribeRemainingMs]);

  const currentMs =
    typeof directRemainingMs === "number" ? directRemainingMs : subscribedMs;
  const formatted = formatRemainingTime(currentMs);

  return (
    <span
      aria-label={`Time remaining: ${formatted}`}
      className="inline-flex items-center justify-center rounded-full border border-ink-border bg-ink-surface px-2.5 py-1 text-xs font-mono font-medium tabular-nums text-parchment-muted"
    >
      <span className="sr-only">Time remaining: </span>
      {formatted}
    </span>
  );
}

/**
 * Reusable timer toggle button with a companion countdown pill.
 *
 * Defaults to hidden. When shown, the ticking countdown is isolated inside
 * `TimerPill` so parents do not re-render on every clock tick.
 */
export function TimerToggle({
  remainingMs,
  subscribeRemainingMs,
  getRemainingMs,
  className = "",
}: TimerToggleProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible((prev) => !prev)}
        className="flex min-h-[44px] items-center justify-center rounded-lg border border-ink-border bg-transparent px-3 py-1.5 text-xs font-medium text-parchment-dim transition hover:border-parchment-dim/40 hover:bg-ink-muted/50 hover:text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {visible ? "Hide timer" : "Show timer"}
      </button>
      {visible ? (
        <TimerPill
          remainingMs={remainingMs}
          subscribeRemainingMs={subscribeRemainingMs}
          getRemainingMs={getRemainingMs}
        />
      ) : null}
    </div>
  );
}
