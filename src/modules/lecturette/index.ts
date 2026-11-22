import type { ModuleDefinition } from "@/core/types";

import { DeckPage } from "./components/DeckPage";
import { buildLecturettePhases } from "./phases";

/**
 * Lecturette practice module.
 * Draws cards from the 4 difficulty tiers and manages 3-minute speaking timers.
 */
export const LecturetteModule: ModuleDefinition = {
  id: "lecturette",
  title: "Lecturette",
  description:
    "Draw a card with four difficulty tiers, choose a topic, and practice your 3-minute lecturette.",
  SetupComponent: DeckPage,
  RunnerComponent: DeckPage,
  buildPhases: () => buildLecturettePhases(),
};
