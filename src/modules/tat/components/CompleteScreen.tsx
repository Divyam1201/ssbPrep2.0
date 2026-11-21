"use client";

import { FullScreenStage } from "@/core/components/FullScreenStage";

export interface CompleteScreenProps {
  imageCount: number;
  onRestart: () => void;
  onSetup: () => void;
}

export function CompleteScreen({
  imageCount,
  onRestart,
  onSetup,
}: CompleteScreenProps) {
  return (
    <FullScreenStage>
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-sky-400 uppercase">
          TAT Practice
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Test Complete
        </h2>
        <p className="mt-3 text-sm text-zinc-400">
          {imageCount} image{imageCount === 1 ? "" : "s"} in this session.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
          >
            Restart test
          </button>
          <button
            type="button"
            onClick={onSetup}
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900"
          >
            Change setup
          </button>
        </div>
      </div>
    </FullScreenStage>
  );
}
