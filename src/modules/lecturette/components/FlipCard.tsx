"use client";

import { useState } from "react";

import type { DeckCard } from "../types";

interface FlipCardProps {
  card: DeckCard;
  onTopicClick: (topicId: string, topicName: string) => void;
  isTopicInUse: (topicId: string) => boolean;
}

export function FlipCard({ card, onTopicClick, isTopicInUse }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) setFlipped(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!flipped && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setFlipped(true);
    }
  };

  return (
    <div
      className="group [perspective:800px]"
      style={{ perspective: "800px" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Card ${card.cardNumber} — showing topics` : `Card ${card.cardNumber} — click to draw`}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        className={`relative h-56 w-full cursor-pointer transition-transform duration-500 motion-reduce:transition-none sm:h-64 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back face (visible when NOT flipped) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-olive bg-olive-dark [backface-visibility:hidden]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="font-mono text-3xl font-bold text-gold sm:text-4xl">
            {String(card.cardNumber).padStart(2, "0")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-parchment-muted">
            Draw
          </span>
        </div>

        {/* Front face (visible when flipped) */}
        <div
          className="absolute inset-0 flex flex-col justify-center gap-1 overflow-hidden rounded-2xl border border-ink-border bg-ink-surface p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-parchment-dim">
              Card {card.cardNumber}
            </span>
            <span className="rounded-full border border-ink-border bg-ink-muted px-2 py-0.5 text-[10px] font-semibold text-parchment-dim">
              {card.topics.length} topic{card.topics.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {card.topics.map((topic) => {
              const inUse = isTopicInUse(topic.id);

              return (
                <button
                  key={topic.id}
                  type="button"
                  disabled={inUse}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!inUse) onTopicClick(topic.id, topic.name);
                  }}
                  className={`group/row relative rounded-xl px-3 py-2 text-left text-sm transition ${
                    inUse
                      ? "cursor-not-allowed border border-gold/30 bg-gold/10 text-parchment-dim"
                      : "border border-transparent hover:border-gold/40 hover:bg-gold/5 hover:pl-5"
                  }`}
                >
                  {/* Gold left bar on hover */}
                  {!inUse && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold opacity-0 transition group-hover/row:opacity-100" />
                  )}

                  <span className={inUse ? "text-parchment-dim" : "text-parchment"}>
                    {topic.name}
                  </span>

                  {inUse && (
                    <span className="ml-2 inline-block rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                      In use
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
