"use client";

import { useId, useState } from "react";

import { AdminLoginModal } from "@/core/components/AdminLoginModal";
import type { LecturetteTier } from "@/server/models/LecturetteTopic";

import { TIER_LABELS } from "../config";

export type FormTopicTier = LecturetteTier | "not_sure";

interface TopicEntry {
  id: string;
  name: string;
  tier: FormTopicTier;
}

interface AddTopicsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTopicsForm({ isOpen, onClose, onSuccess }: AddTopicsFormProps) {
  const [rawText, setRawText] = useState("");
  const [defaultTier, setDefaultTier] = useState<FormTopicTier>("not_sure");
  const [entries, setEntries] = useState<TopicEntry[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  // Status & Feedback
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);

  const rawTextareaId = useId();

  if (!isOpen) return null;

  const handleParse = () => {
    setErrorMessage(null);
    setWarningMessage(null);
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    if (lines.length === 0) {
      setErrorMessage("Please enter at least one topic (one per line).");
      return;
    }

    const overLimit = lines.filter((l) => l.length > 80);
    if (overLimit.length > 0) {
      setErrorMessage(
        `${overLimit.length} topic(s) exceed 80 characters. Please shorten them before continuing.`,
      );
      return;
    }

    const parsedEntries: TopicEntry[] = lines.map((name, idx) => ({
      id: `${Date.now()}-${idx}-${name}`,
      name,
      tier: defaultTier,
    }));

    setEntries(parsedEntries);
    setIsParsed(true);
  };

  const handleUpdateEntryTier = (id: string, tier: FormTopicTier) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, tier } : e)),
    );
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClassifyAllWithAI = async () => {
    const unclassified = entries.filter((e) => e.tier === "not_sure");
    if (unclassified.length === 0) {
      setErrorMessage("All topics already have a specific tier assigned.");
      return;
    }

    setIsClassifying(true);
    setErrorMessage(null);
    setWarningMessage(null);

    try {
      const res = await fetch("/api/lecturette/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: unclassified.map((e) => e.name) }),
      });

      if (res.status === 401) {
        setShowAdminModal(true);
        setIsClassifying(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to classify topics");
      }

      if (data.warning) {
        setWarningMessage(data.warning);
      }

      if (Array.isArray(data.classifications)) {
        const classMap = new Map<string, LecturetteTier>(
          data.classifications.map((c: { name: string; tier: LecturetteTier }) => [
            c.name.toLowerCase().trim(),
            c.tier,
          ]),
        );

        setEntries((prev) =>
          prev.map((entry) => {
            const assigned = classMap.get(entry.name.toLowerCase().trim());
            return assigned ? { ...entry, tier: assigned } : entry;
          }),
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error contacting AI service.",
      );
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async () => {
    if (entries.length === 0) {
      setErrorMessage("No topics to save.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setWarningMessage(null);
    setSuccessInfo(null);

    try {
      const payload = {
        topics: entries.map((e) => ({
          name: e.name,
          tier: e.tier,
        })),
      };

      const res = await fetch("/api/lecturette/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setShowAdminModal(true);
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save topics");
      }

      setSuccessInfo({
        inserted: data.inserted?.length ?? 0,
        skipped: data.skipped?.length ?? 0,
      });

      if (data.warning) {
        setWarningMessage(data.warning);
      }

      onSuccess();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save topics.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-topics-title"
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-ink-border bg-ink-surface text-parchment shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink-border px-6 py-4">
            <div>
              <h2 id="add-topics-title" className="text-lg font-bold text-parchment">
                Add Lecturette Topics
              </h2>
              <p className="text-xs text-parchment-dim">
                Add new topics to the shared practice pool (Admin only)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-parchment-dim transition hover:bg-ink-muted hover:text-parchment"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                {errorMessage}
              </div>
            )}

            {warningMessage && (
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
                ⚠️ {warningMessage}
              </div>
            )}

            {successInfo && (
              <div className="rounded-xl border border-olive-light/40 bg-olive-dark/30 p-3 text-xs text-parchment">
                <span className="font-semibold text-gold">Saved successfully:</span>{" "}
                {successInfo.inserted} new topic(s) added.
                {successInfo.skipped > 0 && (
                  <span className="text-parchment-dim">
                    {" "}({successInfo.skipped} duplicate(s) skipped).
                  </span>
                )}
              </div>
            )}

            {!isParsed ? (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor={rawTextareaId}
                    className="block text-xs font-semibold uppercase tracking-wider text-parchment-dim"
                  >
                    Topics (one per line, max 80 characters each)
                  </label>
                  <textarea
                    id={rawTextareaId}
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Artificial Intelligence\nClimate Change Policy\nIndo-Pacific Strategy\nSwachh Bharat Abhiyan`}
                    className="w-full rounded-xl border border-ink-border bg-ink-muted p-3 text-sm font-mono text-parchment placeholder-parchment-dim/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-parchment-dim">Initial tier:</span>
                    <select
                      value={defaultTier}
                      onChange={(e) =>
                        setDefaultTier(e.target.value as FormTopicTier)
                      }
                      className="rounded-lg border border-ink-border bg-ink-muted px-2.5 py-1.5 text-xs text-parchment focus:border-gold focus:outline-none"
                    >
                      <option value="not_sure">Not sure / Let AI classify</option>
                      <option value="veasy">{TIER_LABELS.veasy}</option>
                      <option value="easy">{TIER_LABELS.easy}</option>
                      <option value="moderate">{TIER_LABELS.moderate}</option>
                      <option value="high">{TIER_LABELS.high}</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={!rawText.trim()}
                    className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold-hover disabled:opacity-40"
                  >
                    Review Topics →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-parchment-dim">
                    {entries.length} topic{entries.length !== 1 ? "s" : ""} to add
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsParsed(false)}
                      className="text-xs text-parchment-dim hover:text-parchment"
                    >
                      ← Edit text
                    </button>
                    {entries.some((e) => e.tier === "not_sure") && (
                      <button
                        type="button"
                        onClick={handleClassifyAllWithAI}
                        disabled={isClassifying}
                        className="rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold transition hover:bg-gold/20 disabled:opacity-50"
                      >
                        {isClassifying ? "Classifying..." : "✨ Classify with AI"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 rounded-xl border border-ink-border bg-ink-muted/50 p-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-xs"
                    >
                      <span className="flex-1 font-medium text-parchment truncate">
                        {entry.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={entry.tier}
                          onChange={(e) =>
                            handleUpdateEntryTier(
                              entry.id,
                              e.target.value as FormTopicTier,
                            )
                          }
                          className={`rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none ${
                            entry.tier === "not_sure"
                              ? "border-gold/40 bg-gold/10 text-gold"
                              : "border-ink-border bg-ink-muted text-parchment"
                          }`}
                        >
                          <option value="not_sure">✨ Let AI classify</option>
                          <option value="veasy">Very Easy</option>
                          <option value="easy">Easy</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">High</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(entry.id)}
                          className="text-parchment-dim hover:text-red-400"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-ink-border px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink-border px-4 py-2 text-xs font-semibold text-parchment-dim transition hover:bg-ink-muted hover:text-parchment"
            >
              Cancel
            </button>
            {isParsed && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || entries.length === 0}
                className="rounded-xl bg-gold px-5 py-2 text-xs font-semibold text-ink transition hover:bg-gold-hover disabled:opacity-40"
              >
                {isSubmitting ? "Saving..." : "Save Topics to Pool"}
              </button>
            )}
          </div>
        </div>
      </div>

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={() => {
          setShowAdminModal(false);
          // Retry submit
          void handleSubmit();
        }}
      />
    </>
  );
}
