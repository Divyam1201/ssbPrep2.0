import type { LecturetteTier } from "@/server/models/LecturetteTopic";

/** Duration of the lecturette timer in seconds (3 minutes). */
export const LECTURETTE_DURATION_SECONDS = 180;

/** Chime frequency for timer-end tone. */
export const CHIME_HZ = 880;

/** Bell fundamental frequency. */
export const BELL_HZ = 660;

/** Tier display labels (not shown on cards, only in admin/add UI). */
export const TIER_LABELS: Record<LecturetteTier, string> = {
  veasy: "Very Easy",
  easy: "Easy",
  moderate: "Moderate",
  high: "High",
};

export const TIER_ORDER: LecturetteTier[] = ["veasy", "easy", "moderate", "high"];
