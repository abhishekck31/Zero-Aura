import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { env } from "../env.js";
import { CardDataSchema, type CardData } from "./aiService.js";

/**
 * Disk-backed cache of generated cards, keyed by ticker.
 *
 * The Gemini free tier allows 20 requests per day per model, and a six-card
 * deck costs six of them — three page reloads would exhaust it. Caching to disk
 * rather than memory is deliberate: `tsx watch` restarts the process on every
 * code edit, and an in-memory cache would re-burn the whole quota each time.
 */

// Resolved from this module rather than `process.cwd()` so the location is the
// same whether the server runs via tsx (src/) or compiled (dist/).
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(HERE, "../../.cache");
const CACHE_FILE = path.join(CACHE_DIR, "cards.json");

const CacheEntrySchema = z.object({
  card: CardDataSchema,
  generatedAt: z.string(),
  model: z.string(),
});

const CacheFileSchema = z.record(z.string(), CacheEntrySchema);

export type CacheEntry = z.infer<typeof CacheEntrySchema>;
type CacheFile = z.infer<typeof CacheFileSchema>;

let memory: CacheFile | null = null;

/**
 * Load the cache once per process. A missing or corrupt file is not an error —
 * it just means an empty cache, and the next generation will rewrite it.
 */
async function load(): Promise<CacheFile> {
  if (memory) return memory;

  try {
    const contents = await readFile(CACHE_FILE, "utf8");
    const parsed = CacheFileSchema.safeParse(JSON.parse(contents));
    if (!parsed.success) {
      console.warn("[cache] discarding malformed cards.json");
      memory = {};
    } else {
      // Cards are only valid for the model that produced them. Without this,
      // swapping provider or model would silently serve the previous model's
      // cards in milliseconds and look like the new one was working.
      const kept: CacheFile = {};
      let dropped = 0;
      for (const [ticker, entry] of Object.entries(parsed.data)) {
        if (entry.model === env.OPENROUTER_MODEL) {
          kept[ticker] = entry;
        } else {
          dropped += 1;
        }
      }

      memory = kept;
      console.log(
        `[cache] loaded ${Object.keys(kept).length} card(s) from disk` +
          (dropped > 0
            ? ` (dropped ${dropped} from a different model)`
            : ""),
      );
    }
  } catch {
    memory = {};
  }

  return memory;
}

// Feed generation runs six writes in parallel; serialising them stops the last
// writer from clobbering entries written while it was serialising its own copy.
let writeChain: Promise<void> = Promise.resolve();

function queueWrite(task: () => Promise<void>): Promise<void> {
  writeChain = writeChain.then(task, task);
  return writeChain;
}

async function flush(): Promise<void> {
  if (!memory) return;
  const snapshot = JSON.stringify(memory, null, 2);
  await mkdir(CACHE_DIR, { recursive: true });
  // Write-then-rename so a crash mid-write can't leave a truncated file.
  const temp = `${CACHE_FILE}.tmp`;
  await writeFile(temp, snapshot, "utf8");
  await rename(temp, CACHE_FILE);
}

/** Return the cached card for a ticker, or null on a miss. */
export async function getCached(ticker: string): Promise<CacheEntry | null> {
  const cache = await load();
  return cache[ticker.toUpperCase()] ?? null;
}

/** Store a freshly generated card, write-through to disk. */
export async function putCached(
  ticker: string,
  card: CardData,
  model: string,
): Promise<void> {
  const cache = await load();
  cache[ticker.toUpperCase()] = {
    card,
    generatedAt: new Date().toISOString(),
    model,
  };

  await queueWrite(async () => {
    try {
      await flush();
    } catch (error) {
      // A cache write failure must never fail the request — the card is
      // already generated and the user should still get it.
      console.error("[cache] write failed:", error);
    }
  });
}

/** Number of cards currently cached. Reported at boot. */
export async function cachedCount(): Promise<number> {
  return Object.keys(await load()).length;
}
