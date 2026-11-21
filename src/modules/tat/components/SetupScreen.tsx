"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminSetManager } from "@/core/components/AdminSetManager";
import { LocalFileDropzone } from "@/core/components/LocalFileDropzone";
import { SharedSetList } from "@/core/components/SharedSetList";
import {
  loadLocalCustomSet,
  purgeExpiredLocalSets,
  saveLocalCustomSet,
} from "@/core/files/localSetStore";
import type { ModuleSetupProps, SessionItem } from "@/core/types";
import type { PublicRecentSet } from "@/server/services/setService";

import {
  MAX_STANDARD_IMAGES,
  STANDARD_IMAGES,
  TAT_MODES,
  VIEW_SECONDS,
  WRITE_SECONDS,
  type TatMode,
} from "../config";
import { createTatSession } from "../session";

export function SetupScreen({ onStart }: ModuleSetupProps) {
  const [mode, setMode] = useState<TatMode>(TAT_MODES.standard);
  const [selectedSharedSet, setSelectedSharedSet] =
    useState<PublicRecentSet | null>(null);
  const [isUsingStandardSet, setIsUsingStandardSet] = useState(true);

  // Local device custom set state
  const [localFiles, setLocalFiles] = useState<readonly File[]>([]);
  const [localSetName, setLocalSetName] = useState("My Device Set");
  const [localStoreMessage, setLocalStoreMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Purge expired sets and restore previously saved local custom set on mount
  useEffect(() => {
    void purgeExpiredLocalSets();

    void loadLocalCustomSet("tat").then((res) => {
      if (res.data && res.data.files.length > 0) {
        // Reconstruct File objects from stored blobs
        const restored = res.data.files.map(
          (sf) => new File([sf.blob], sf.name, { type: sf.type }),
        );
        setLocalFiles(restored);
        setLocalSetName(res.data.name);
        if (res.isInMemoryFallback) {
          setLocalStoreMessage("Saved in-memory for this session (local storage unavailable).");
        } else {
          setLocalStoreMessage("Restored previous set saved on this device (24h TTL).");
        }
      }
    });
  }, []);

  const handleLocalFilesChange = async (files: readonly File[]) => {
    setLocalFiles(files);
    if (files.length > 0) {
      const res = await saveLocalCustomSet("tat", localSetName, files);
      if (res.isInMemoryFallback) {
        setLocalStoreMessage("Saving in-memory for this session (local storage unavailable).");
      } else {
        setLocalStoreMessage("Saved on this device for 24 hours.");
      }
    } else {
      setLocalStoreMessage(null);
    }
  };

  const handleSelectSharedSet = (set: PublicRecentSet) => {
    setIsUsingStandardSet(false);
    setSelectedSharedSet(set);
  };

  const handleSelectStandardSet = () => {
    setIsUsingStandardSet(true);
    setSelectedSharedSet(null);
  };

  const imageCount =
    mode === TAT_MODES.custom
      ? localFiles.length
      : isUsingStandardSet
        ? STANDARD_IMAGES.length
        : selectedSharedSet?.itemCount || 0;

  const canStart = imageCount > 0;

  const handleStart = () => {
    if (!canStart) return;

    if (mode === TAT_MODES.custom) {
      // Local device files only — zero network requests
      const items: SessionItem[] = localFiles.map((file, index) => ({
        id: `local-${index}-${file.name}`,
        file,
        alt: `Local image ${index + 1}`,
      }));
      onStart(createTatSession(mode, items));
    } else if (isUsingStandardSet || !selectedSharedSet) {
      // Built-in standard set
      onStart(createTatSession(TAT_MODES.standard));
    } else {
      // Admin shared set from public pool
      const items: SessionItem[] = selectedSharedSet.files.map((f, index) => ({
        id: f.key,
        src: f.url,
        alt: f.name || `TAT image ${index + 1}`,
      }));
      onStart(createTatSession(TAT_MODES.standard, items));
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="text-sm text-[#c2b9a7] transition hover:text-[#f4efe6]"
      >
        ← All modules
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#cba358]">
          Module
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f4efe6] sm:text-4xl">
          TAT Practice
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c2b9a7] sm:text-base">
          Theme Appreciation Test. Each image is shown for{" "}
          <span className="text-[#f4efe6]">{VIEW_SECONDS} seconds</span>, then the
          screen goes blank for{" "}
          <span className="text-[#f4efe6]">{WRITE_SECONDS / 60} minutes</span> of
          writing. Everything runs on a hidden timer.
        </p>
      </header>

      {/* Mode selection */}
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[#f4efe6]">Choose practice mode</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            title={`Standard & Public Sets (${isUsingStandardSet ? MAX_STANDARD_IMAGES : selectedSharedSet?.itemCount || "Shared"})`}
            description="Practice with built-in sets or curated sets uploaded by the admin."
            selected={mode === TAT_MODES.standard}
            onSelect={() => setMode(TAT_MODES.standard)}
          />
          <ModeCard
            title="Custom set (Device only)"
            description="Use your own images. Stored on this device only for 24 hours — never uploaded to any server."
            selected={mode === TAT_MODES.custom}
            onSelect={() => setMode(TAT_MODES.custom)}
          />
        </div>
      </section>

      {/* Main Mode Content */}
      <section className="mt-8">
        {mode === TAT_MODES.standard ? (
          <div className="space-y-6">
            {/* Standard built-in set card */}
            <div className="space-y-3 hidden">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#cba358]">
                Built-in Standard Set
              </h3>
              <button
                type="button"
                onClick={handleSelectStandardSet}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isUsingStandardSet
                    ? "border-[#cba358] bg-[#cba358]/10 ring-1 ring-[#cba358]"
                    : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-[#f4efe6]">
                    Standard Official Placeholder Set
                  </span>
                  <span className="rounded-full border border-[#5d6b4f]/40 bg-[#5d6b4f]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7c8e6a] uppercase">
                    Complete Set (11)
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11">
                  {STANDARD_IMAGES.map((img) => {
                    return(<div
                      key={img.id}
                      className="aspect-square overflow-hidden rounded border border-[#282f2c] bg-[#e7e1d5]"
                    >
                      <img
                        src={img.src}
                        alt=""
                        className="h-full w-full object-contain"
                      /> 
                    </div>)
})}
                </div>
              </button>
            </div>

            {/* Public Shared Sets list */}
            <SharedSetList
              module="tat"
              selectedSetId={isUsingStandardSet ? null : selectedSharedSet?.id}
              onSelectSet={handleSelectSharedSet}
              refreshTrigger={refreshTrigger}
            />

            {/* Admin Management Section (Login / Upload) */}
            <AdminSetManager
              currentModule="tat"
              onSetUploaded={() => {
                setRefreshTrigger((t) => t + 1);
              }}
            />
          </div>
        ) : (
          /* Custom Set (Browser-only, IndexedDB) */
          <div className="space-y-4">
            <div>
              <label
                htmlFor="local-set-name"
                className="block text-xs font-medium text-[#c2b9a7]"
              >
                Set name
              </label>
              <input
                id="local-set-name"
                type="text"
                value={localSetName}
                onChange={(e) => {
                  setLocalSetName(e.target.value);
                  if (localFiles.length > 0) {
                    void saveLocalCustomSet("tat", e.target.value, localFiles);
                  }
                }}
                placeholder="e.g. My Personal Practice Set"
                className="mt-1.5 w-full rounded-xl border border-[#282f2c] bg-[#141716] px-4 py-2 text-sm text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
              />
            </div>

            <LocalFileDropzone
              files={localFiles}
              onFilesChange={handleLocalFilesChange}
            />

            <div className="flex items-center justify-between text-xs text-[#8c8273]">
              <span>
                {localStoreMessage || "Saved on this device for 24 hours."}
              </span>
              <span className="text-[#cba358]">Zero network uploads</span>
            </div>
          </div>
        )}
      </section>

      {/* Start button */}
      <div className="mt-8 flex flex-col items-start gap-3 border-t border-[#282f2c] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#8c8273]">
          No countdown, no clock. An optional tone can be muted during the test.
        </p>
        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#cba358] px-6 py-3 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:cursor-not-allowed disabled:bg-[#1e2321] disabled:text-[#8c8273] sm:w-auto"
        >
          Start test · {imageCount} image{imageCount === 1 ? "" : "s"}
        </button>
      </div>
    </main>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function ModeCard({
  title,
  description,
  selected,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-[#cba358] bg-[#cba358]/10"
          : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#f4efe6]">{title}</span>
        <span
          aria-hidden="true"
          className={`h-3.5 w-3.5 rounded-full border ${
            selected
              ? "border-[#cba358] bg-[#cba358]"
              : "border-[#8c8273] bg-transparent"
          }`}
        />
      </span>
      <span className="mt-1 block text-xs leading-relaxed text-[#c2b9a7]">
        {description}
      </span>
    </button>
  );
}
