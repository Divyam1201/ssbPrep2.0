import type { ModuleDefinition } from "@/core/types";

import { TatModule } from "./tat";
import { WatModule } from "./wat";

/**
 * The single list of modules the app knows about.
 *
 * Adding a module = new folder under `src/modules/<id>/` + one line here.
 * Pages never import a module directly; they only read this registry.
 */
export const modules: readonly ModuleDefinition[] = [TatModule, WatModule];

for (const definition of modules) {
  if (
    modules.filter((candidate) => candidate.id === definition.id).length > 1
  ) {
    throw new Error(`Duplicate module id in registry: "${definition.id}"`);
  }
}

export function getModules(): readonly ModuleDefinition[] {
  return modules;
}

export function getModule(moduleId: string): ModuleDefinition | undefined {
  return modules.find((definition) => definition.id === moduleId);
}
