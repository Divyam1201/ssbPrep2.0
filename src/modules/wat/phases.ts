import type { Phase, SessionConfig, SessionItem } from "@/core/types";

import { WORD_DISPLAY_SECONDS } from "./config";

export interface WatPhaseHooks {
  onWordChange?: (index: number) => void;
}

/**
 * Builds timed phases for WAT: each word is shown for exactly 15 seconds.
 */
export function buildWatPhases(
  items: readonly SessionItem[],
  _config: SessionConfig,
  hooks: WatPhaseHooks = {},
): Phase[] {
  return items.map((item, index) => ({
    id: `${item.id}:word`,
    durationSec: WORD_DISPLAY_SECONDS,
    showTimer: true,
    onStart: () => hooks.onWordChange?.(index),
  }));
}
