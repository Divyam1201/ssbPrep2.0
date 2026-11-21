import type { SessionItem } from "@/core/types";

/** How long each image stays on screen. */
export const VIEW_SECONDS = 30;

/** How long the blank writing phase lasts for each image. */
export const WRITE_SECONDS = 240;

/** Hard cap for the built-in placeholder image set. */
export const MAX_STANDARD_IMAGES = 11;

export const TAT_MODES = {
  standard: "standard",
  custom: "custom",
} as const;

export type TatMode = (typeof TAT_MODES)[keyof typeof TAT_MODES];

/** Beep tones (Hz). Sound is optional and can be muted in the runner. */
export const WRITE_START_BEEP_HZ = 880;
export const WRITE_END_BEEP_HZ = 520;

function standardImageSrc(index: number): string {
  return `/tat/standard-${String(index + 1).padStart(2, "0")}.svg`;
}

/**
 * Built-in placeholder set. It is generated from MAX_STANDARD_IMAGES so the
 * count can never exceed the cap.
 */
export const STANDARD_IMAGES: readonly SessionItem[] = Array.from(
  { length: MAX_STANDARD_IMAGES },
  (_, index) => ({
    id: `standard-${index + 1}`,
    src: standardImageSrc(index),
    alt: `TAT placeholder image ${index + 1}`,
  }),
);
