"use client";

import { useEffect, useState } from "react";

import { ConfirmEndDialog } from "@/core/components/ConfirmEndDialog";
import { FullScreenStage } from "@/core/components/FullScreenStage";
import type { ModuleRunnerProps } from "@/core/types";

import { useWatSession } from "../hooks/useWatSession";
import { CompleteScreen } from "./CompleteScreen";
import { InstructionsScreen } from "./InstructionsScreen";

export function WatRunner({ session, onSetup }: ModuleRunnerProps) {
  const wat = useWatSession({ session });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 1. Instructions screen before test begins
  if (wat.status === "instructions") {
    return (
      <InstructionsScreen
        totalWords={wat.totalWords}
        onStart={wat.startTest}
        onExit={onSetup}
      />
    );
  }

  // 2. Complete screen when all words finish
  if (wat.status === "complete") {
    return (
      <CompleteScreen
        wordCount={wat.totalWords}
        onRestart={wat.restart}
        onSetup={onSetup}
      />
    );
  }

  return (
    <>
      <FullScreenStage
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={wat.toggleMuted}
                aria-pressed={wat.muted}
                className="rounded-lg border border-[#282f2c] bg-[#141716] px-3 py-1.5 text-xs font-medium text-[#c2b9a7] transition hover:bg-[#1e2321]"
              >
                {wat.muted ? "Sound off" : "Sound on"}
              </button>

              {wat.status === "running" ? (
                <button
                  type="button"
                  onClick={wat.pause}
                  className="rounded-lg border border-[#282f2c] bg-[#141716] px-3 py-1.5 text-xs font-medium text-[#c2b9a7] transition hover:border-[#cba358] hover:text-[#f4efe6]"
                >
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={wat.resume}
                  className="rounded-lg border border-[#cba358] bg-[#cba358]/20 px-3 py-1.5 text-xs font-semibold text-[#cba358] transition hover:bg-[#cba358]/30"
                >
                  Resume
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  wat.pause();
                  setConfirmOpen(true);
                }}
                className="rounded-lg border border-[#282f2c] bg-[#141716] px-3 py-1.5 text-xs font-medium text-[#c2b9a7] transition hover:border-red-500/60 hover:text-red-300"
              >
                End test
              </button>
            </div>

            {/* Word index indicator & countdown bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[#8c8273]">
                Word{" "}
                <span className="font-semibold text-[#f4efe6]">
                  {wat.currentIndex + 1}
                </span>{" "}
                of {wat.totalWords}
              </span>
              <CountdownBar
                subscribeRemainingMs={wat.subscribeRemainingMs}
                getRemainingMs={wat.getRemainingMs}
              />
            </div>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center text-center">
          {wat.status === "paused" ? (
            <div className="rounded-2xl border border-[#282f2c] bg-[#141716] p-8 sm:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cba358]">
                Test Paused
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#f4efe6] sm:text-3xl">
                Ready to continue?
              </h2>
              <p className="mt-2 text-sm text-[#8c8273]">
                Timer paused at word {wat.currentIndex + 1} of {wat.totalWords}.
              </p>
              <button
                type="button"
                onClick={wat.resume}
                className="mt-6 inline-flex rounded-xl bg-[#cba358] px-6 py-2.5 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668]"
              >
                Resume test
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Word display */}
              <div className="px-4 py-8">
                <span className="font-serif text-5xl font-bold tracking-wider text-[#f4efe6] uppercase select-none sm:text-7xl md:text-8xl">
                  {wat.currentWord}
                </span>
              </div>

              {/* Centered circular countdown ring */}
              <div className="flex justify-center">
                <CountdownRing
                  subscribeRemainingMs={wat.subscribeRemainingMs}
                  getRemainingMs={wat.getRemainingMs}
                />
              </div>
            </div>
          )}
        </div>
      </FullScreenStage>

      <ConfirmEndDialog
        open={confirmOpen}
        title="End WAT test now?"
        description="Your practice session will end immediately and take you to the results summary."
        confirmLabel="End test"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmOpen(false);
          wat.endTest();
        }}
        onCancel={() => {
          setConfirmOpen(false);
          wat.resume();
        }}
      />
    </>
  );
}

function CountdownBar({
  subscribeRemainingMs,
  getRemainingMs,
}: {
  subscribeRemainingMs: (listener: (ms: number) => void) => () => void;
  getRemainingMs: () => number;
}) {
  const [ms, setMs] = useState(getRemainingMs);

  useEffect(() => {
    return subscribeRemainingMs((remaining) => setMs(remaining));
  }, [subscribeRemainingMs]);

  const sec = Math.ceil(ms / 1000);
  const percent = Math.max(0, Math.min(100, (ms / 15000) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#282f2c]">
        <div
          className="h-full bg-[#cba358] transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-6 text-right font-mono text-xs font-semibold text-[#cba358]">
        {sec}s
      </span>
    </div>
  );
}

function CountdownRing({
  subscribeRemainingMs,
  getRemainingMs,
}: {
  subscribeRemainingMs: (listener: (ms: number) => void) => () => void;
  getRemainingMs: () => number;
}) {
  const [ms, setMs] = useState(getRemainingMs);

  useEffect(() => {
    return subscribeRemainingMs((remaining) => setMs(remaining));
  }, [subscribeRemainingMs]);

  const sec = Math.ceil(ms / 1000);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ms / 15000) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="stroke-[#282f2c]"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="stroke-[#cba358] transition-all duration-200 ease-linear"
          strokeWidth="3.5"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold text-[#cba358]">
        {sec}
      </span>
    </div>
  );
}
