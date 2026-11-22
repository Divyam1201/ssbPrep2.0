import type { ModuleDefinition } from "@/core/types";

import { WatRunner } from "./components/Runner";
import { SetupScreen } from "./components/SetupScreen";
import { buildWatPhases } from "./phases";

/**
 * WAT module entry point. Everything the registry needs is exported here.
 */
export const WatModule: ModuleDefinition = {
  id: "wat",
  title: "WAT Practice",
  description:
    "Word Association Test — view each word for 15 seconds. Auto-advancing with audio chime. No answers captured.",
  SetupComponent: SetupScreen,
  RunnerComponent: WatRunner,
  buildPhases: (items, config) => buildWatPhases(items, config),
};
