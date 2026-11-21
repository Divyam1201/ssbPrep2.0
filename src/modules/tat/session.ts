import type { PreparedSession, SessionItem } from "@/core/types";

import { STANDARD_IMAGES, TAT_MODES, type TatMode } from "./config";

/**
 * Creates a PreparedSession for TAT practice.
 * In standard mode, uses the built-in 11 placeholder images.
 * In custom or shared mode, uses the provided session items.
 */
export function createTatSession(
  mode: TatMode,
  items: readonly SessionItem[] = [],
): PreparedSession {
  const sessionItems: readonly SessionItem[] =
    mode === TAT_MODES.standard ? STANDARD_IMAGES : items;

  return {
    config: { mode },
    items: sessionItems,
  };
}
