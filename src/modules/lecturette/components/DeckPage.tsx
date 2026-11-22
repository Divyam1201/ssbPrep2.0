"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { buildDeck } from "../deckBuilder";
import { useLecturetteAudio } from "../hooks/useLecturetteAudio";
import { useTimerStack } from "../hooks/useTimerStack";
import { useTopics } from "../hooks/useTopics";
import type { DeckCard } from "../types";
import { AddTopicsForm } from "./AddTopicsForm";
import { FlipCard } from "./FlipCard";
import { TimerPanel } from "./TimerPanel";

export function DeckPage() {
  const { topics, isLoading, error, refetch } = useTopics();
  const { playChime, playBell } = useLecturetteAudio();

  // Trigger bell when any timer reaches 00:00
  const handleTimerEnd = useCallback(() => {
    playBell();
  }, [playBell]);

  const {
    timers,
    startTimer,
    resetTimer,
    endTimer,
    isTopicInUse,
    getRemainingMs,
  } = useTimerStack(handleTimerEnd);

  // Deck generation: re-shuffled when topics change or on explicit "Shuffle deck"
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Build deck from fetched topics
  const cards: DeckCard[] = useMemo(() => {
    if (topics.length === 0) return [];
    // shuffleIndex triggers recomputation without refetching from DB
    void shuffleIndex;
    return buildDeck(topics);
  }, [topics, shuffleIndex]);

  const handleShuffle = () => {
    setShuffleIndex((prev) => prev + 1);
  };

  const handleTopicClick = useCallback(
    (topicId: string, topicName: string) => {
      playChime();
      startTimer(topicId, topicName);
    },
    [playChime, startTimer],
  );

  return (
    <div className="relative min-h-screen bg-ink text-parchment">
      {/* Fixed top-right timer stack */}
      <TimerPanel
        timers={timers}
        getRemainingMs={getRemainingMs}
        onReset={resetTimer}
        onEnd={endTimer}
        onManualBell={playBell}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation / Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-ink-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="group mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-parchment-dim transition hover:text-gold"
            >
              <span className="transition group-hover:-translate-x-0.5">←</span> All modules
            </Link>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-parchment sm:text-4xl">
              Lecturette Practice
            </h1>
            <p className="mt-1 text-sm text-parchment-muted">
              Draw a card, pick a topic, and speak for 3 minutes under timed conditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={isLoading || topics.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-border bg-ink-surface px-4 py-2.5 text-xs font-semibold text-parchment transition hover:border-gold/40 hover:bg-ink-muted disabled:opacity-40"
            >
              <span>🔀</span> Shuffle deck
            </button>

            <button
              type="button"
              onClick={() => setIsAddFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-gold-hover"
            >
              <span>+</span> Add topics
            </button>
          </div>
        </div>

        {/* Deck metadata count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-medium text-parchment-dim">
            <span>
              {topics.length} topic{topics.length !== 1 ? "s" : ""} in pool
            </span>
            <span>·</span>
            <span>
              {cards.length} card{cards.length !== 1 ? "s" : ""} generated
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-ink-border bg-ink-surface/50 text-parchment-dim">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
            <span className="text-xs">Dealing cards...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-ink-border bg-ink-surface px-4 py-2 text-xs font-semibold text-parchment hover:bg-ink-muted"
            >
              Retry
            </button>
          </div>
        )}

        {/* Card Grid */}
        {!isLoading && !error && cards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {cards.map((card) => (
              <FlipCard
                key={`${shuffleIndex}-${card.cardNumber}`}
                card={card}
                onTopicClick={handleTopicClick}
                isTopicInUse={isTopicInUse}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && cards.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-ink-border bg-ink-surface p-6 text-center text-parchment-dim">
            <p className="text-sm font-medium text-parchment">No cards available.</p>
            <p className="text-xs">
              Add topics across the four tiers to deal practice cards.
            </p>
          </div>
        )}
      </div>

      {/* Add topics modal */}
      <AddTopicsForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={() => {
          void refetch();
        }}
      />
    </div>
  );
}
