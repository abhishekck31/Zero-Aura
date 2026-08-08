/**
 * Mirrors `CardDataSchema` in `backend/src/services/aiService.ts`.
 * The backend validates against Zod; this is the client-side shape contract.
 */
export interface CardData {
  ticker: string;
  companyName: string;
  headline: string;
  thesis: string[];
  catalysts: string[];
  risks: string[];
  /** Whether this specific card came from Gemini or the curated fallback. */
  source: CardSource;
  /** Present when the card was served from the backend's disk cache. */
  cachedAt?: string;
}

/** Which way the user swiped. Right is bullish, left is bearish. */
export type SwipeDirection = "bullish" | "bearish";

/** Provenance of a single card. */
export type CardSource = "ai" | "mock";

/** Deck-level rollup. `partial` means some cards are live and some are not. */
export type DeckSource = "ai" | "partial" | "mock";

export interface FeedResponse {
  cards: CardData[];
  source: DeckSource;
  liveCount: number;
  total: number;
}
