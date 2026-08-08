import { Router } from "express";
import { z } from "zod";

import { mockCardDeck, mockCards } from "../data/mockCards.js";
import { mockTranscripts } from "../data/mockTranscripts.js";
import { env, isAiEnabled } from "../env.js";
import { generateMarketCard, type CardData } from "../services/aiService.js";
import { getCached, putCached } from "../services/cardCache.js";

export const cardRouter = Router();

/** Where an individual card came from. */
export type CardSource = "ai" | "mock";

/** Deck-level rollup. `partial` means some cards are live and some are not. */
export type DeckSource = "ai" | "partial" | "mock";

export interface FeedCard extends CardData {
  source: CardSource;
  /** Present when the card was served from disk rather than generated now. */
  cachedAt?: string;
}

const GenerateBodySchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, "ticker is required")
    .max(10, "ticker must be 10 characters or fewer")
    .transform((value) => value.toUpperCase()),
  rawText: z
    .string()
    .trim()
    .min(20, "rawText must be at least 20 characters to be worth analysing"),
});

const FeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(6),
  /** Bypass the cache and regenerate every card. */
  refresh: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

function fallbackFor(ticker: string): CardData | null {
  return mockCards[ticker.toUpperCase()] ?? null;
}

/**
 * Random order without indexed swaps, which keeps it clean under
 * `noUncheckedIndexedAccess`. The slight distribution bias of a sort-by-random
 * shuffle is irrelevant for a deck this size.
 */
function shuffle<T>(items: readonly T[]): T[] {
  return items
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/**
 * POST /api/cards/generate
 *
 * Deliberately uncached: the caller supplies arbitrary source text, so a
 * ticker alone is not a valid cache key here.
 */
cardRouter.post("/generate", async (req, res) => {
  const parsed = GenerateBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  const { ticker, rawText } = parsed.data;

  if (!isAiEnabled) {
    const fallback = fallbackFor(ticker);
    if (!fallback) {
      res.status(503).json({
        error:
          "AI is not configured (OPENROUTER_API_KEY missing) and no mock card exists for this ticker.",
      });
      return;
    }
    res.json({ card: { ...fallback, source: "mock" satisfies CardSource } });
    return;
  }

  try {
    const card = await generateMarketCard(ticker, rawText);
    res.json({ card: { ...card, source: "ai" satisfies CardSource } });
  } catch (error) {
    console.error(`[cards] generation failed for ${ticker}:`, error);

    const fallback = fallbackFor(ticker);
    if (!fallback) {
      res.status(502).json({
        error: "Card generation failed and no mock card exists for this ticker.",
      });
      return;
    }
    res.json({ card: { ...fallback, source: "mock" satisfies CardSource } });
  }
});

/**
 * GET /api/cards/feed?limit=6&refresh=false
 *
 * Builds the deck in one round trip. Cached cards cost no API quota; only
 * misses hit Gemini, and each card degrades to its mock independently.
 */
cardRouter.get("/feed", async (req, res) => {
  const parsed = FeedQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid query parameters",
      details: z.treeifyError(parsed.error),
    });
    return;
  }

  const { limit, refresh } = parsed.data;

  if (!isAiEnabled) {
    // Only the hand-written tickers have curated cards, so mock mode draws
    // from those rather than from the full transcript corpus.
    const cards = shuffle(mockCardDeck)
      .slice(0, limit)
      .map((card) => ({ ...card, source: "mock" satisfies CardSource }));

    res.json({
      cards,
      source: "mock" satisfies DeckSource,
      liveCount: 0,
      total: cards.length,
    });
    return;
  }

  // Sampled, not sliced — otherwise every deck is the same tickers in the same
  // order regardless of how large the corpus grows.
  const selected = shuffle(mockTranscripts).slice(0, limit);

  const settled = await Promise.allSettled(
    selected.map(async (entry): Promise<FeedCard> => {
      if (!refresh) {
        const cached = await getCached(entry.ticker);
        if (cached) {
          return {
            ...cached.card,
            source: "ai",
            cachedAt: cached.generatedAt,
          };
        }
      }

      const card = await generateMarketCard(entry.ticker, entry.rawText);
      await putCached(entry.ticker, card, env.OPENROUTER_MODEL);
      return { ...card, source: "ai" };
    }),
  );

  const cards = settled.flatMap((result, index): FeedCard[] => {
    if (result.status === "fulfilled") return [result.value];

    const entry = selected[index];
    console.error(
      `[cards] feed generation failed for ${entry?.ticker ?? "unknown"}:`,
      result.reason,
    );

    const fallback = entry ? fallbackFor(entry.ticker) : null;
    return fallback ? [{ ...fallback, source: "mock" }] : [];
  });

  // Most of the corpus has no curated counterpart, so a wide outage (quota
  // exhaustion, say) would otherwise return a short deck. Top it back up from
  // the hand-written cards that aren't already in play.
  if (cards.length < limit) {
    const present = new Set(cards.map((card) => card.ticker));
    for (const card of shuffle(mockCardDeck)) {
      if (cards.length >= limit) break;
      if (present.has(card.ticker)) continue;
      cards.push({ ...card, source: "mock" });
      present.add(card.ticker);
    }
  }

  if (cards.length === 0) {
    res.status(502).json({ error: "Failed to generate any cards." });
    return;
  }

  const liveCount = cards.filter((card) => card.source === "ai").length;
  const source: DeckSource =
    liveCount === cards.length ? "ai" : liveCount === 0 ? "mock" : "partial";

  res.json({ cards, source, liveCount, total: cards.length });
});
