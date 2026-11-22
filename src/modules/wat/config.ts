import type { SessionItem } from "@/core/types";

/** Maximum number of words in a complete WAT set. */
export const MAX_WORDS = 60;

/** How many seconds each word is shown during the test. */
export const WORD_DISPLAY_SECONDS = 15;

/** Chime frequency (Hz) played on every word transition. */
export const CHIME_FREQUENCY_HZ = 784; // G5 note
export const CHIME_DURATION_MS = 180;

export const WAT_MODES = {
  standard: "standard",
  custom: "custom",
} as const;

export type WatMode = (typeof WAT_MODES)[keyof typeof WAT_MODES];

/**
 * 60 standard SSB psychology words for built-in practice.
 */
export const STANDARD_WORDS: readonly string[] = [
  "Lie",
  "System",
  "Blood",
  "Character",
  "Attack",
  "Peace",
  "Duty",
  "Fail",
  "Care",
  "Leader",
  "Team",
  "Cinema",
  "Love",
  "Fight",
  "Work",
  "Delay",
  "Danger",
  "Company",
  "Hijack",
  "Help",
  "Worry",
  "Society",
  "Dark",
  "Fire",
  "Mother",
  "Risk",
  "Music",
  "Home",
  "Defeat",
  "Meet",
  "Atom",
  "Snake",
  "Give",
  "Rule",
  "Gun",
  "Friend",
  "Organize",
  "Win",
  "Disgrace",
  "Choice",
  "Hard",
  "Problem",
  "Impossible",
  "Alone",
  "Sports",
  "Fear",
  "Initiative",
  "Death",
  "Knowledge",
  "Youth",
  "Rest",
  "Play",
  "Brave",
  "Quick",
  "Family",
  "Guide",
  "Uniform",
  "Honest",
  "Command",
  "Nation",
];

export const STANDARD_ITEMS: readonly SessionItem[] = STANDARD_WORDS.map(
  (word, index) => ({
    id: `wat-standard-${index + 1}`,
    label: word,
    alt: `WAT word: ${word}`,
  }),
);
