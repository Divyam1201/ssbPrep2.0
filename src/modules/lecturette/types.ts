import type { LecturetteTier } from "@/server/models/LecturetteTopic";

export interface LecturetteTopic {
  id: string;
  name: string;
  tier: LecturetteTier;
}

export interface DeckCard {
  /** 1-based card index for the deck. */
  cardNumber: number;
  topics: LecturetteTopic[];
}

export interface ActiveTimer {
  id: string;
  topicName: string;
  endsAt: number;
  durationMs: number;
  status: "running" | "finished";
}
