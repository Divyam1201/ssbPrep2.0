"use client";

import type { ReactNode } from "react";

export interface FullScreenStageProps {
  children: ReactNode;
  /** Optional small controls pinned to the top-right corner. */
  actions?: ReactNode;
}

/**
 * Distraction-free dark stage that covers the whole viewport.
 * No chrome, no clock: only what the current module phase puts inside.
 */
export function FullScreenStage({ children, actions }: FullScreenStageProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-zinc-100">
      {actions ? (
        <div className="flex shrink-0 items-center justify-end gap-2 px-4 py-3 sm:px-6">
          {actions}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
}
