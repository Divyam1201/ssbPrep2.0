import type { ModuleDefinition } from "@/core/types";

import { SetupScreen } from "./components/SetupScreen";
import { TatRunner } from "./components/Runner";
import { buildTatPhases } from "./phases";

/**
 * TAT module entry point. Everything the registry needs is exported here and
 * nothing in the shared core knows what a TAT is.
 */
export const TatModule: ModuleDefinition = {
  id: "tat",
  title: "TAT Practice",
  description:
    "Theme Appreciation Test — view each image for 30 seconds, then write for 4 minutes. Timers stay hidden.",
  SetupComponent: SetupScreen,
  RunnerComponent: TatRunner,
  buildPhases: (items, config) => buildTatPhases(items, config),
};
