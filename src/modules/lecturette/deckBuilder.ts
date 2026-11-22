import type { LecturetteTier } from "@/server/models/LecturetteTopic";

import { TIER_ORDER } from "./config";
import type { DeckCard, LecturetteTopic } from "./types";

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build the card deck from a flat list of topics.
 *
 * Logic (ported from the prototype):
 * 1. Group topics by tier and shuffle each tier independently.
 * 2. Number of cards = size of the largest tier.
 * 3. Card i gets the i-th topic from each tier that still has one (1-4 topics per card).
 * 4. Shuffle topics within each card, then shuffle the cards.
 */
export function buildDeck(topics: readonly LecturetteTopic[]): DeckCard[] {
  // Group by tier
  const byTier: Record<LecturetteTier, LecturetteTopic[]> = {
    veasy: [],
    easy: [],
    moderate: [],
    high: [],
  };

  for (const t of topics) {
    if (byTier[t.tier]) {
      byTier[t.tier].push(t);
    }
  }

  // Shuffle each tier
  for (const tier of TIER_ORDER) {
    byTier[tier] = shuffle(byTier[tier]);
  }

  // Number of cards = size of the largest tier
  const maxLen = Math.max(...TIER_ORDER.map((t) => byTier[t].length), 0);

  if (maxLen === 0) return [];

  // Build cards
  const cards: DeckCard[] = [];
  for (let i = 0; i < maxLen; i++) {
    const cardTopics: LecturetteTopic[] = [];
    for (const tier of TIER_ORDER) {
      if (i < byTier[tier].length) {
        cardTopics.push(byTier[tier][i]);
      }
    }
    cards.push({
      cardNumber: i + 1, // will be reassigned after shuffle
      topics: shuffle(cardTopics),
    });
  }

  // Shuffle card order and reassign card numbers
  const shuffled = shuffle(cards);
  return shuffled.map((card, idx) => ({
    ...card,
    cardNumber: idx + 1,
  }));
}
