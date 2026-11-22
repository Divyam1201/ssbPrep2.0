"use client";

import { FullScreenStage } from "@/core/components/FullScreenStage";

export interface CompleteScreenProps {
  wordCount: number;
  onRestart: () => void;
  onSetup: () => void;
}

export function CompleteScreen({
  wordCount,
  onRestart,
  onSetup,
}: CompleteScreenProps) {
  const totalSeconds = wordCount * 15;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <FullScreenStage>
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cba358]">
          WAT Practice
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#f4efe6] sm:text-4xl">
          Test Complete
        </h2>
        <p className="mt-3 text-sm text-[#c2b9a7]">
          {wordCount} word{wordCount === 1 ? "" : "s"} completed · Total time:{" "}
          <span className="font-medium text-[#f4efe6]">
            {minutes > 0 ? `${minutes}m ` : ""}
            {seconds > 0 || minutes === 0 ? `${seconds}s` : ""}
          </span>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl bg-[#cba358] px-6 py-3 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668]"
          >
            Restart test
          </button>
          <button
            type="button"
            onClick={onSetup}
            className="rounded-xl border border-[#282f2c] bg-[#141716] px-6 py-3 text-sm font-medium text-[#f4efe6] transition hover:border-[#5d6b4f] hover:bg-[#1e2321]"
          >
            Change setup
          </button>
        </div>
      </div>
    </FullScreenStage>
  );
}
