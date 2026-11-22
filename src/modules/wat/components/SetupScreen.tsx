"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AdminLoginModal } from "@/core/components/AdminLoginModal";
import { SharedSetList } from "@/core/components/SharedSetList";
import {
  loadLocalCustomSet,
  purgeExpiredLocalSets,
  saveLocalCustomWordsSet,
} from "@/core/files/localSetStore";
import type { ModuleSetupProps, SessionItem } from "@/core/types";
import type { PublicRecentSet } from "@/server/services/setService";

import {
  MAX_WORDS,
  STANDARD_WORDS,
  WAT_MODES,
  WORD_DISPLAY_SECONDS,
  type WatMode,
} from "../config";
import { createWatSession } from "../session";
import { extractWords } from "../utils/extractWords";
import { readPdfText } from "../utils/readPdfText";

export function SetupScreen({ onStart }: ModuleSetupProps) {
  const [mode, setMode] = useState<WatMode>(WAT_MODES.standard);
  const [selectedSharedSet, setSelectedSharedSet] =
    useState<PublicRecentSet | null>(null);
  const [isUsingStandardSet, setIsUsingStandardSet] = useState(true);

  // Custom / Creator state
  const [customSetName, setCustomSetName] = useState("My Practice Words");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [newWordInput, setNewWordInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Notices & error messages
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSavingShared, setIsSavingShared] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );
  const [localStoreMessage, setLocalStoreMessage] = useState<string | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Submit shared set modal / drawer state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [sharedSetName, setSharedSetName] = useState("");
  const [sharedWords, setSharedWords] = useState<string[]>([]);
  const [sharedNotice, setSharedNotice] = useState<string | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sharedFileInputRef = useRef<HTMLInputElement>(null);

  // Purge expired sets and restore previously saved local custom set on mount
  useEffect(() => {
    void purgeExpiredLocalSets();

    void loadLocalCustomSet("wat").then((res) => {
      if (res.data?.words && res.data.words.length > 0) {
        setCustomWords(res.data.words);
        setCustomSetName(res.data.name);
        if (res.isInMemoryFallback) {
          setLocalStoreMessage(
            "Saved in-memory for this session (local storage unavailable).",
          );
        } else {
          setLocalStoreMessage(
            "Restored previous word set saved on this device (24h TTL).",
          );
        }
      }
    });
  }, []);

  // Handle PDF file upload & extraction
  const handlePdfUpload = async (
    file: File,
    target: "custom" | "shared" = "custom",
  ) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      const err = "Please upload a valid PDF file.";
      if (target === "custom") setErrorMessage(err);
      else setSharedError(err);
      return;
    }

    setIsExtracting(true);
    if (target === "custom") {
      setErrorMessage(null);
      setNoticeMessage(null);
    } else {
      setSharedError(null);
      setSharedNotice(null);
    }

    try {
      const rawText = await readPdfText(file);
      const parsed = extractWords(rawText);

      if (parsed.length === 0) {
        throw new Error(
          "This PDF has no selectable text. Please upload a text-based PDF or paste the words manually.",
        );
      }

      let cappedWords = parsed;
      let notice: string | null = null;
      if (parsed.length > MAX_WORDS) {
        cappedWords = parsed.slice(0, MAX_WORDS);
        notice = `Found ${parsed.length} words. Kept the first ${MAX_WORDS} (WAT limit).`;
      }

      if (target === "custom") {
        setCustomWords(cappedWords);
        setNoticeMessage(notice);
        void saveLocalCustomWordsSet("wat", customSetName, cappedWords);
      } else {
        setSharedWords(cappedWords);
        setSharedNotice(notice);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to read PDF. Please check the file or paste words manually.";
      if (target === "custom") setErrorMessage(msg);
      else setSharedError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle text input parsing
  const handleParseTextInput = (target: "custom" | "shared" = "custom") => {
    if (!textInput.trim()) return;

    const parsed = extractWords(textInput);
    if (parsed.length === 0) {
      const err = "No valid alphabetic words found in the provided text.";
      if (target === "custom") setErrorMessage(err);
      else setSharedError(err);
      return;
    }

    let cappedWords = parsed;
    let notice: string | null = null;
    if (parsed.length > MAX_WORDS) {
      cappedWords = parsed.slice(0, MAX_WORDS);
      notice = `Found ${parsed.length} words. Kept the first ${MAX_WORDS} (WAT limit).`;
    }

    if (target === "custom") {
      setCustomWords(cappedWords);
      setNoticeMessage(notice);
      setErrorMessage(null);
      setTextInput("");
      void saveLocalCustomWordsSet("wat", customSetName, cappedWords);
    } else {
      setSharedWords(cappedWords);
      setSharedNotice(notice);
      setSharedError(null);
      setTextInput("");
    }
  };

  // Add a single word to the custom list
  const handleAddWord = () => {
    const trimmed = newWordInput.trim();
    if (!trimmed) return;

    if (customWords.length >= MAX_WORDS) {
      setNoticeMessage(`Maximum limit of ${MAX_WORDS} words reached.`);
      return;
    }

    const [extracted] = extractWords(trimmed);
    if (!extracted) {
      setErrorMessage(
        "Invalid word. Words must consist of alphabetic characters only.",
      );
      return;
    }

    if (customWords.some((w) => w.toLowerCase() === extracted.toLowerCase())) {
      setErrorMessage(`Word "${extracted}" is already in the list.`);
      return;
    }

    const updated = [...customWords, extracted];
    setCustomWords(updated);
    setNewWordInput("");
    setErrorMessage(null);
    setNoticeMessage(null);
    void saveLocalCustomWordsSet("wat", customSetName, updated);
  };

  // Delete word from custom list
  const handleDeleteWord = (index: number) => {
    const updated = customWords.filter((_, i) => i !== index);
    setCustomWords(updated);
    setNoticeMessage(null);
    void saveLocalCustomWordsSet("wat", customSetName, updated);
  };

  // Save inline edited word
  const handleSaveEditWord = (index: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) {
      handleDeleteWord(index);
      setEditingIndex(null);
      return;
    }

    const [extracted] = extractWords(trimmed);
    if (!extracted) {
      setErrorMessage("Invalid word format.");
      return;
    }

    const updated = [...customWords];
    updated[index] = extracted;
    setCustomWords(updated);
    setEditingIndex(null);
    setEditingValue("");
    void saveLocalCustomWordsSet("wat", customSetName, updated);
  };

  // Save as shared set to MongoDB via POST /api/sets
  const handleSaveSharedSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedSetName.trim()) {
      setSharedError("Please enter a set name.");
      return;
    }

    if (sharedWords.length === 0) {
      setSharedError("Please upload or enter at least one word.");
      return;
    }

    setIsSavingShared(true);
    setSharedError(null);

    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "wat",
          name: sharedSetName.trim(),
          words: sharedWords,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        setIsAdminLoginOpen(true);
        throw new Error(
          "Admin privileges required to publish shared sets to MongoDB.",
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save shared set");
      }

      setSaveSuccessMessage(`Successfully published set "${sharedSetName}"!`);
      setIsSubmitModalOpen(false);
      setSharedWords([]);
      setSharedSetName("");
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setSharedError(
        err instanceof Error ? err.message : "Error creating shared set",
      );
    } finally {
      setIsSavingShared(false);
    }
  };

  // Active item count calculation
  const wordCount =
    mode === WAT_MODES.custom
      ? customWords.length
      : isUsingStandardSet
        ? STANDARD_WORDS.length
        : selectedSharedSet?.itemCount || 0;

  const canStart = wordCount > 0;

  const handleStart = () => {
    if (!canStart) return;

    if (mode === WAT_MODES.custom) {
      const items: SessionItem[] = customWords.map((word, index) => ({
        id: `local-${index}-${word}`,
        label: word,
        alt: `WAT word ${index + 1}: ${word}`,
      }));
      onStart(createWatSession(mode, items));
    } else if (isUsingStandardSet || !selectedSharedSet) {
      onStart(createWatSession(WAT_MODES.standard));
    } else {
      // Shared set selected from MongoDB
      const items: SessionItem[] = (selectedSharedSet.words || []).map(
        (word, index) => ({
          id: `shared-${selectedSharedSet.id}-${index}`,
          label: word,
          alt: `WAT word ${index + 1}: ${word}`,
        }),
      );
      onStart(createWatSession(WAT_MODES.standard, items));
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
          WAT Practice
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c2b9a7] sm:text-base">
          Word Association Test. Words appear one at a time for{" "}
          <span className="text-[#f4efe6]">{WORD_DISPLAY_SECONDS} seconds</span>{" "}
          each. Write the first thought that comes to mind on your own paper. The
          test auto-advances. Pure practice with no answer capture.
        </p>
      </header>

      {/* Mode selection cards */}
      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold text-[#f4efe6]">
          Choose practice mode
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            title={`Standard & Shared Sets (${isUsingStandardSet ? MAX_WORDS : selectedSharedSet?.itemCount || "Shared"})`}
            description="Practice with the official 60-word psychological set or curated sets from the shared pool."
            selected={mode === WAT_MODES.standard}
            onSelect={() => setMode(WAT_MODES.standard)}
          />
          <ModeCard
            title={`Custom Set (${customWords.length > 0 ? `${customWords.length} words` : "Device only"})`}
            description="Upload a text PDF or paste custom words. Stored on this device only for 24 hours."
            selected={mode === WAT_MODES.custom}
            onSelect={() => setMode(WAT_MODES.custom)}
          />
        </div>
      </section>

      {/* Mode Content */}
      <section className="mt-8">
        {mode === WAT_MODES.standard ? (
          <div className="space-y-6">
            {/* Standard built-in 60-word set card */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#cba358]">
                Built-in Standard Set
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsUsingStandardSet(true);
                  setSelectedSharedSet(null);
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isUsingStandardSet
                    ? "border-[#cba358] bg-[#cba358]/10 ring-1 ring-[#cba358]"
                    : "border-[#282f2c] bg-[#141716] hover:border-[#5d6b4f]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#f4efe6]">
                    Standard Official 60-Word Set
                  </span>
                  <span className="rounded-full border border-[#5d6b4f]/40 bg-[#5d6b4f]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7c8e6a] uppercase">
                    Complete Set (60)
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#8c8273]">
                  Lie, System, Blood, Character, Attack, Peace, Duty, Fail,
                  Care, Leader, Team… (60 words)
                </p>
              </button>
            </div>

            {/* Public Shared Sets list with Submit button header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#cba358]">
                  Community & Admin Shared Sets
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSharedError(null);
                    setSharedNotice(null);
                    setIsSubmitModalOpen(true);
                  }}
                  className="rounded-lg border border-[#cba358]/40 bg-[#cba358]/10 px-3 py-1.5 text-xs font-semibold text-[#cba358] transition hover:bg-[#cba358]/20"
                >
                  + Submit a set
                </button>
              </div>

              {saveSuccessMessage ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
                  {saveSuccessMessage}
                </div>
              ) : null}

              <SharedSetList
                module="wat"
                selectedSetId={
                  isUsingStandardSet ? null : selectedSharedSet?.id
                }
                onSelectSet={(set) => {
                  setIsUsingStandardSet(false);
                  setSelectedSharedSet(set);
                }}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        ) : (
          /* Custom Set (Client-side only) */
          <div className="space-y-6">
            <div>
              <label
                htmlFor="wat-custom-set-name"
                className="block text-xs font-medium text-[#c2b9a7]"
              >
                Set name
              </label>
              <input
                id="wat-custom-set-name"
                type="text"
                value={customSetName}
                onChange={(e) => {
                  setCustomSetName(e.target.value);
                  if (customWords.length > 0) {
                    void saveLocalCustomWordsSet(
                      "wat",
                      e.target.value,
                      customWords,
                    );
                  }
                }}
                placeholder="e.g. Daily Practice Words"
                className="mt-1.5 w-full rounded-xl border border-[#282f2c] bg-[#141716] px-4 py-2 text-sm text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
              />
            </div>

            {/* Input choices: Upload PDF or Paste Text */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* PDF upload card */}
              <div className="rounded-2xl border border-[#282f2c] bg-[#141716] p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#cba358]">
                  Option 1: Upload text PDF
                </h4>
                <p className="mt-1 text-xs text-[#8c8273]">
                  Extracted entirely on device. PDF is never stored.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handlePdfUpload(file, "custom");
                  }}
                />

                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#5d6b4f]/60 bg-[#5d6b4f]/10 px-4 py-3 text-xs font-medium text-[#f4efe6] transition hover:border-[#cba358] hover:bg-[#cba358]/10 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <span>Reading PDF text layer…</span>
                  ) : (
                    <span>Choose PDF file</span>
                  )}
                </button>
              </div>

              {/* Textbox paste card */}
              <div className="rounded-2xl border border-[#282f2c] bg-[#141716] p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#cba358]">
                  Option 2: Paste words or text
                </h4>
                <p className="mt-1 text-xs text-[#8c8273]">
                  Numbered, comma-separated, or multi-column text.
                </p>

                <textarea
                  rows={2}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g. 1. Courage 2. Duty 3. Victory..."
                  className="mt-3 w-full rounded-xl border border-[#282f2c] bg-[#0d0f0e] p-2.5 text-xs text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleParseTextInput("custom")}
                  disabled={!textInput.trim()}
                  className="mt-2 w-full rounded-xl bg-[#5d6b4f] px-3 py-1.5 text-xs font-semibold text-[#f4efe6] transition hover:bg-[#7c8e6a] disabled:opacity-40"
                >
                  Extract words from text
                </button>
              </div>
            </div>

            {/* Error & notice messages */}
            {errorMessage ? (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                {errorMessage}
              </div>
            ) : null}

            {noticeMessage ? (
              <div className="rounded-xl border border-[#cba358]/30 bg-[#cba358]/10 p-3 text-xs text-[#cba358]">
                {noticeMessage}
              </div>
            ) : null}

            {/* Editable word preview list */}
            {customWords.length > 0 ? (
              <div className="space-y-4 rounded-2xl border border-[#282f2c] bg-[#141716] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282f2c] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#f4efe6]">
                      Extracted Words ({customWords.length} / {MAX_WORDS})
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        customWords.length === MAX_WORDS
                          ? "border border-[#5d6b4f]/40 bg-[#5d6b4f]/30 text-[#7c8e6a]"
                          : "border border-[#8c8273]/30 bg-[#8c8273]/20 text-[#c2b9a7]"
                      }`}
                    >
                      {customWords.length === MAX_WORDS
                        ? "Complete Set"
                        : "Partial Set"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomWords([]);
                      void saveLocalCustomWordsSet("wat", customSetName, []);
                    }}
                    className="text-xs text-[#8c8273] transition hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>

                {/* Add new word input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newWordInput}
                    onChange={(e) => setNewWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddWord();
                      }
                    }}
                    placeholder="Add a single word..."
                    disabled={customWords.length >= MAX_WORDS}
                    className="flex-1 rounded-xl border border-[#282f2c] bg-[#0d0f0e] px-3 py-1.5 text-xs text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none disabled:opacity-40"
                  />
                  <button
                    type="button"
                    onClick={handleAddWord}
                    disabled={
                      !newWordInput.trim() || customWords.length >= MAX_WORDS
                    }
                    className="rounded-xl bg-[#cba358] px-4 py-1.5 text-xs font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:opacity-40"
                  >
                    + Add
                  </button>
                </div>

                {/* Word badges */}
                <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pt-2">
                  {customWords.map((word, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-1.5 rounded-lg border border-[#282f2c] bg-[#0d0f0e] px-2.5 py-1 text-xs text-[#f4efe6]"
                    >
                      <span className="font-mono text-[10px] text-[#8c8273]">
                        {idx + 1}.
                      </span>

                      {editingIndex === idx ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveEditWord(idx)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEditWord(idx);
                            if (e.key === "Escape") setEditingIndex(null);
                          }}
                          className="w-20 rounded bg-[#1e2321] px-1 text-xs text-[#cba358] outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(idx);
                            setEditingValue(word);
                          }}
                          className="hover:underline"
                          title="Click to edit word"
                        >
                          {word}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteWord(idx)}
                        className="ml-1 text-[#8c8273] opacity-60 transition hover:text-red-400 group-hover:opacity-100"
                        title="Delete word"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[#8c8273]">
                  <span>
                    {localStoreMessage || "Saved on this device for 24 hours."}
                  </span>
                  <span className="text-[#cba358]">Zero network uploads</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Start Button footer */}
      <div className="mt-8 flex flex-col items-start gap-3 border-t border-[#282f2c] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#8c8273]">
          Each word displays for 15 seconds. Sound chime on word changes can be
          muted anytime.
        </p>
        <button
          type="button"
          disabled={!canStart}
          onClick={handleStart}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#cba358] px-6 py-3 text-sm font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:cursor-not-allowed disabled:bg-[#1e2321] disabled:text-[#8c8273] sm:w-auto"
        >
          Start test · {wordCount} word{wordCount === 1 ? "" : "s"} (
          {Math.floor((wordCount * 15) / 60)}m {(wordCount * 15) % 60}s)
        </button>
      </div>

      {/* Submit Shared Set Modal */}
      {isSubmitModalOpen ? (
        <div
          role="presentation"
          onClick={() => setIsSubmitModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#282f2c] bg-[#141716] p-6 text-[#f4efe6] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#282f2c] pb-3">
              <div>
                <h3 className="text-base font-semibold text-[#f4efe6]">
                  Submit WAT Practice Set
                </h3>
                <p className="text-xs text-[#8c8273]">
                  Share a set to the public pool in MongoDB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-lg text-[#8c8273] hover:text-[#f4efe6]"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSharedSet} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c2b9a7]">
                  Set Name
                </label>
                <input
                  type="text"
                  required
                  value={sharedSetName}
                  onChange={(e) => setSharedSetName(e.target.value)}
                  placeholder="e.g. SSB Allahabad Psych 2026"
                  className="mt-1 w-full rounded-xl border border-[#282f2c] bg-[#0d0f0e] px-3 py-2 text-xs text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
                />
              </div>

              {/* PDF or text upload */}
              <div>
                <label className="block text-xs font-medium text-[#c2b9a7]">
                  Words Source
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="file"
                    ref={sharedFileInputRef}
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePdfUpload(file, "shared");
                    }}
                  />
                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={() => sharedFileInputRef.current?.click()}
                    className="rounded-xl border border-[#282f2c] bg-[#0d0f0e] px-3 py-2 text-xs font-medium text-[#cba358] transition hover:bg-[#1e2321]"
                  >
                    Upload text PDF
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c2b9a7]">
                  Or paste text
                </label>
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste numbered or comma-separated words..."
                  className="mt-1 w-full rounded-xl border border-[#282f2c] bg-[#0d0f0e] p-2 text-xs text-[#f4efe6] placeholder-[#8c8273] focus:border-[#cba358] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleParseTextInput("shared")}
                  disabled={!textInput.trim()}
                  className="mt-1.5 rounded-lg bg-[#5d6b4f] px-3 py-1 text-xs font-medium text-[#f4efe6] disabled:opacity-40"
                >
                  Parse Words
                </button>
              </div>

              {sharedError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-300">
                  {sharedError}
                </div>
              ) : null}

              {sharedNotice ? (
                <div className="rounded-xl border border-[#cba358]/30 bg-[#cba358]/10 p-2.5 text-xs text-[#cba358]">
                  {sharedNotice}
                </div>
              ) : null}

              {sharedWords.length > 0 ? (
                <div className="rounded-xl border border-[#282f2c] bg-[#0d0f0e] p-3 text-xs">
                  <div className="flex items-center justify-between text-[#8c8273]">
                    <span>
                      Words parsed:{" "}
                      <strong className="text-[#f4efe6]">
                        {sharedWords.length} / {MAX_WORDS}
                      </strong>
                    </span>
                    <span className="text-[#cba358]">
                      {sharedWords.length === MAX_WORDS
                        ? "Complete Set"
                        : "Partial Set"}
                    </span>
                  </div>
                  <div className="mt-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                    {sharedWords.map((w, idx) => (
                      <span
                        key={idx}
                        className="rounded border border-[#282f2c] bg-[#141716] px-1.5 py-0.5 text-[11px] text-[#f4efe6]"
                      >
                        {idx + 1}. {w}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2 border-t border-[#282f2c] pt-4">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-xl border border-[#282f2c] px-4 py-2 text-xs font-medium text-[#c2b9a7] hover:bg-[#1e2321]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingShared || sharedWords.length === 0}
                  className="rounded-xl bg-[#cba358] px-5 py-2 text-xs font-semibold text-[#0d0f0e] transition hover:bg-[#ddb668] disabled:opacity-40"
                >
                  {isSavingShared ? "Saving..." : "Save to Shared Pool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Admin Login Modal if unauthorized */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setSharedError(null);
        }}
      />
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
