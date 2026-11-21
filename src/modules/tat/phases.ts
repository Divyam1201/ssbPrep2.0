import type { Phase, SessionConfig, SessionItem } from "@/core/types";

import { VIEW_SECONDS, WRITE_SECONDS } from "./config";

export interface TatPhaseHooks {
  onWriteStart?: (itemIndex: number) => void;
  onWriteEnd?: (itemIndex: number) => void;
}

/**
 * TAT timeline: per image a hidden 30s view phase followed by a hidden 240s
 * write phase. Both phases set `showTimer: false`.
 */
export function buildTatPhases(
  items: readonly SessionItem[],
  _config: SessionConfig,
  hooks: TatPhaseHooks = {},
): Phase[] {
  return items.flatMap((item, index) => [
    {
      id: `${item.id}:view`,
      durationSec: VIEW_SECONDS,
      showTimer: false,
    },
    {
      id: `${item.id}:write`,
      durationSec: WRITE_SECONDS,
      showTimer: false,
      onStart: () => hooks.onWriteStart?.(index),
      onEnd: () => hooks.onWriteEnd?.(index),
    },
  ]);
}
