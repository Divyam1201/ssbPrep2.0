"use client";

import { useState } from "react";

import type { ModuleUi, PreparedSession } from "@/core/types";

export interface ModuleHostProps {
  /**
   * Only the renderable part of a module is passed from the server page;
   * `buildPhases` stays in the module's own hook.
   */
  module: ModuleUi;
}

/**
 * Runs the module lifecycle every module shares: setup screen first, then the
 * module's own runner. Modules never have to implement this switch themselves.
 */
export function ModuleHost({ module }: ModuleHostProps) {
  const [session, setSession] = useState<PreparedSession | null>(null);

  if (session === null) {
    return <module.SetupComponent onStart={setSession} />;
  }

  return (
    <module.RunnerComponent
      session={session}
      onSetup={() => setSession(null)}
    />
  );
}
