import type { Phase } from "@/core/types";

/**
 * Lecturette uses an interactive deck and a top-right timer stack rather than
 * linear test phases. We export an empty phase builder for ModuleDefinition compliance.
 */
export function buildLecturettePhases(): Phase[] {
  return [];
}
