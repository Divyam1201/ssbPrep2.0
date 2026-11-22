"use client";

import { FullScreenStage } from "@/core/components/FullScreenStage";

export interface InstructionsScreenProps {
  totalWords: number;
  onStart: () => void;
  onExit: () => void;
}

export function InstructionsScreen({
  totalWords,
  onStart,
  onExit,
}: InstructionsScreenProps) {
  const totalSeconds = totalWords * 15;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <FullScreenStage
      actions={
        <button
          type="button"
          onClick={onExit}
          className="rounded-lg border border-[#282f2c] bg-[#141716] px-3 py-1.5 text-xs font-medium text-[#c2b9a7] transition hover:border-red-500/50 hover:text-red-300"
        >
          Exit to setup
        </button>
      }
    >
      <div className="w-full max-w-xl text-left">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cba358]">
            Instructions
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#f4efe6] sm:text-3xl">
            Word Association Test (WAT)
          </h1>
          <p className="mt-2 text-xs text-[#8c8273]">
            {totalWords} word{totalWords === 1 ? "" : "s"} · 15 seconds each · Total
            time: {minutes > 0 ? `${minutes}m ` : ""}
            {seconds > 0 || minutes === 0 ? `${seconds}s` : ""}
          </p>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-[#282f2c] bg-[#141716] p-5 text-sm leading-relaxed text-[#c2b9a7]">
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5d6b4f]/30 text-[11px] font-semibold text-[#cba358]">
              1
            </span>
            <p>
              A total of{" "}
              <strong className="text-[#f4efe6]">{totalWords} words</strong> will
              be displayed one at a time.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5d6b4f]/30 text-[11px] font-semibold text-[#cba358]">
              2
            </span>
            <p>
              Each word stays on screen for exactly{" "}
              <strong className="text-[#f4efe6]">15 seconds</strong>. The test{" "}
              <strong className="text-[#f4efe6]">auto-advances</strong> to the next
              word automatically.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5d6b4f]/30 text-[11px] font-semibold text-[#cba358]">
              3
            </span>
            <p>
              Write the <strong className="text-[#f4efe6]">first thought</strong>{" "}
              or sentence that comes to your mind on your own paper. Spontaneity
              and natural reaction are essential.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5d6b4f]/30 text-[11px] font-semibold text-[#cba358]">
              4
            </span>
            <p>
              A chime will sound whenever the word changes. Keep your paper and
              pen ready before beginning.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-xs text-[#8c8273]">
            Pure practice environment · No answers captured · Zero AI
          </span>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#cba358] px-6 py-3 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] sm:w-auto"
          >
            I am ready · Begin test
          </button>
        </div>
      </div>
    </FullScreenStage>
  );
}
