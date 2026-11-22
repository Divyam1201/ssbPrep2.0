import type { PreparedSession, SessionItem } from "@/core/types";

import { STANDARD_ITEMS, WAT_MODES, type WatMode } from "./config";

/**
 * Creates a PreparedSession for WAT practice.
 * In standard mode with no custom items, uses the built-in 60 words.
 * In custom or shared mode, uses the provided session items.
 */
export function createWatSession(
  mode: WatMode,
  items: readonly SessionItem[] = [],
): PreparedSession {
  const sessionItems: readonly SessionItem[] =
    mode === WAT_MODES.standard && items.length === 0
      ? STANDARD_ITEMS
      : items;

  return {
    config: { mode },
    items: sessionItems,
  };
}
