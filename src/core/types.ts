import type { ComponentType } from "react";

/**
 * One timed step of a practice session.
 *
 * `showTimer` is a per-phase option on purpose: some modules (TAT) never reveal
 * the countdown, while others (SRT) show a single visible countdown.
 */
export interface Phase {
  id: string;
  durationSec: number;
  showTimer: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Module-agnostic description of one thing being practised: an image, a word,
 * a situation, etc. Only `id` is required so every module can decide what to use.
 */
export interface SessionItem {
  id: string;
  /** Public URL for visual items (used by built-in sets). */
  src?: string;
  /** Local upload; modules create/revoke object URLs from it. */
  file?: File;
  /** Short text for word/situation based modules. */
  label?: string;
  /** Accessible description of the item. */
  alt?: string;
}

/** Settings chosen on a module's setup screen. */
export interface SessionConfig {
  /** Module-defined mode identifier, e.g. "standard" or "custom". */
  mode: string;
}

/** Everything a module needs to run a session. */
export interface PreparedSession {
  config: SessionConfig;
  items: readonly SessionItem[];
}

export interface ModuleSetupProps {
  onStart: (session: PreparedSession) => void;
}

export interface ModuleRunnerProps {
  session: PreparedSession;
  /** Leave the runner and return to the module's setup screen. */
  onSetup: () => void;
}

/**
 * The module contract. A module is a folder plus one line in the registry;
 * nothing else in the app knows about it.
 */
export interface ModuleDefinition {
  id: string;
  title: string;
  description: string;
  SetupComponent: ComponentType<ModuleSetupProps>;
  RunnerComponent: ComponentType<ModuleRunnerProps>;
  buildPhases: (
    items: readonly SessionItem[],
    config: SessionConfig,
  ) => Phase[];
}

/**
 * The renderable subset of a module. Safe to hand from a Server Component to
 * the client `ModuleHost` (plain data + client component references).
 */
export type ModuleUi = Pick<
  ModuleDefinition,
  "id" | "title" | "SetupComponent" | "RunnerComponent"
>;
