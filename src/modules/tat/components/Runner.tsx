"use client";

import { useState } from "react";

import { ConfirmEndDialog } from "@/core/components/ConfirmEndDialog";
import { FullScreenStage } from "@/core/components/FullScreenStage";
import { TimerToggle } from "@/core/components/TimerToggle";
import type { ModuleRunnerProps } from "@/core/types";

import { useTatSession } from "../hooks/useTatSession";
import { CompleteScreen } from "./CompleteScreen";
import { ImageViewer } from "./ImageViewer";
import { WritingScreen } from "./WritingScreen";

export function TatRunner({ session, onSetup }: ModuleRunnerProps) {
  const tat = useTatSession({ session });
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (tat.status === "complete") {
    return (
      <CompleteScreen
        imageCount={tat.images.length}
        onRestart={tat.restart}
        onSetup={onSetup}
      />
    );
  }

  return (
    <>
      <FullScreenStage
        actions={
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={tat.toggleMuted}
                aria-pressed={tat.muted}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                {tat.muted ? "Sound off" : "Sound on"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-red-500/60 hover:text-red-300"
              >
                End test
              </button>
            </div>
            <div className="flex w-full items-center justify-start gap-2">
              <TimerToggle
                subscribeRemainingMs={tat.subscribeRemainingMs}
                getRemainingMs={tat.getRemainingMs}
              />
            </div>
          </div>
        }
      >
        {tat.phaseKind === "write" ? (
          <WritingScreen preloadSrc={tat.nextSrc} />
        ) : (
          <ImageViewer
            src={tat.currentSrc}
            alt={tat.images[tat.currentIndex]?.alt ?? "TAT image"}
            index={tat.currentIndex}
            total={tat.images.length}
          />
        )}
      </FullScreenStage>

      <ConfirmEndDialog
        open={confirmOpen}
        title="End the test now?"
        description="Your current image will be skipped and the test will finish."
        confirmLabel="End test"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmOpen(false);
          tat.endTest();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
