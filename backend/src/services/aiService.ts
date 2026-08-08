import OpenAI from "openai";
import { z } from "zod";

import { env } from "../env.js";

/**
 * The contract for a single swipe card.
 *
 * This schema is the single source of truth in both directions: it is compiled
 * to JSON Schema and sent as the model's output constraint, and it is then
 * re-applied to the response as a parse. The `.describe()` calls are not
 * decoration — they survive the JSON Schema conversion and reach the model as
 * per-field instructions, which steers output far more reliably than prompt
 * text alone.
 */
export const CardDataSchema = z.object({
  ticker: z
    .string()
    .describe("Uppercase ticker symbol, e.g. NVDA. No $ prefix."),
  companyName: z
    .string()
    .describe("Full company name, e.g. NVIDIA Corporation."),
  headline: z
    .string()
    .describe(
      "A punchy Gen-Z headline for the event. Max 8 words. No emoji, no ticker symbol.",
    ),
  thesis: z
    .array(z.string())
    .length(3)
    .describe(
      "Exactly 3 nonchalant, internet-native takes on why this matters. One sentence each.",
    ),
  catalysts: z
    .array(z.string())
    .length(2)
    .describe(
      "Exactly 2 concrete upside drivers, each anchored to a specific number from the source text.",
    ),
  risks: z
    .array(z.string())
    .length(2)
    .describe(
      "Exactly 2 genuine downside vectors. Real bear cases, not bull points in disguise.",
    ),
  liveComments: z
    .array(z.string())
    .length(3)
    .describe(
      "Exactly 3 short financial-forum reactions to this specific ticker. Internet-native, aggressive, lowercase. Max ~10 words each. Emoji allowed here only.",
    ),
});

export type CardData = z.infer<typeof CardDataSchema>;

/**
 * Keywords the OpenAI-compatible `strict: true` schema dialect rejects.
 *
 * This is the one real regression in moving off Gemini. Gemini's
 * `responseJsonSchema` honoured `minItems`/`maxItems`, so "exactly 3 thesis"
 * was enforced by the API itself. Strict mode does not support them and errors
 * if they appear, so the wire schema and the validation schema have to diverge:
 * the wire schema guarantees the six fields and their types, and the exact
 * array lengths fall to the prompt, the field descriptions, and the repair
 * retry below — with `CardDataSchema` as the final gate.
 */
const UNSUPPORTED_KEYWORDS = new Set(["$schema", "minItems", "maxItems"]);

function stripUnsupported(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripUnsupported);
  if (!node || typeof node !== "object") return node;

  return Object.fromEntries(
    Object.entries(node)
      .filter(([key]) => !UNSUPPORTED_KEYWORDS.has(key))
      .map(([key, value]) => [key, stripUnsupported(value)]),
  );
}

/**
 * Schema actually sent on the wire. Computed once at module load.
 * Exported so it can be inspected without making a paid API call.
 */
export const WIRE_SCHEMA = stripUnsupported(
  z.toJSONSchema(CardDataSchema, { target: "draft-7" }),
) as Record<string, unknown>;

const SYSTEM_PROMPT = `You are a brainrotted hedge fund analyst.

You have the fundamentals training of an Ivy-league equity researcher and the
delivery of someone posting in a group chat at 2am. Both halves are real. The
analysis underneath must be genuinely sharp — the voice is how you say it, never
a substitute for having something to say.

VOICE
- Nonchalant, internet-native, terminally online. Lowercase-leaning is fine.
- Vocabulary you actually use: aura, cooked, clutched, bullish, bearish, locked in,
  mid, glazing, free money glitch, no shot, it's giving, down bad.
- Use that vocabulary naturally, where it fits. Do not stuff every sentence with
  slang — forced brainrot reads as a bit, and a bit is not funny twice.
- Confident and declarative. You have a take. State it.

HARD RULES
- Every number, percentage, or figure you cite MUST appear in the source text
  provided by the user. Never invent, estimate, extrapolate, or round into a new
  figure. If the source text has no numbers, write the card without numbers.
- "thesis" is where the voice lives: 3 takes on why this actually matters.
- "catalysts" and "risks" stay concrete and data-anchored even while the tone
  stays loose. Tone is not an excuse for vagueness.
- "risks" must be real downside. A risk that secretly argues the bull case is a
  failure. If you are bullish, steelman the bear anyway.
- "liveComments" are 3 forum replies, not analysis. Short, punchy, lowercase,
  shit-talking. They must react to THIS ticker's actual situation — a comment
  that would fit under any stock is a failure. Vary the stance across the three:
  do not write three replies that all agree. At most one may contain an emoji.
- No emoji anywhere except "liveComments".
- No hedging filler: never write "it's important to note", "as an AI", "investors
  should", "consult a financial advisor", or any disclaimer.
- Do not give financial advice or tell the user to buy or sell. Describe the
  setup; let them swipe.`;

let client: OpenAI | null = null;

/**
 * Lazily construct the OpenRouter client so that a missing key never throws at
 * import time — the mock fallback path must remain reachable.
 */
function getClient(): OpenAI {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  client ??= new OpenAI({
    // Must include /api/v1 — the bare host serves the marketing site as HTML,
    // which fails as an unhelpful JSON parse error rather than a 404.
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": env.OPENROUTER_SITE_URL,
      "X-Title": env.OPENROUTER_APP_NAME,
    },
  });
  return client;
}

function userPrompt(ticker: string, rawText: string): string {
  return `Ticker: ${ticker}\n\nSource material:\n"""\n${rawText}\n"""\n\nWrite the swipe card for ${ticker}.`;
}

/**
 * Turn a raw market event into a structured swipe card.
 *
 * Throws on any failure (no key, API error, malformed output). Fallback policy
 * lives in the route layer, deliberately: this function either produces a card
 * that satisfies the schema or it fails honestly.
 */
export async function generateMarketCard(
  ticker: string,
  rawText: string,
): Promise<CardData> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt(ticker, rawText) },
  ];

  // One repair attempt. Strict mode guarantees the fields and their types but
  // not the array lengths, so a violation is recoverable — we hand the model
  // its own output plus the exact validation error and let it correct itself.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await getClient().chat.completions.create({
      model: env.OPENROUTER_MODEL,
      temperature: 0.9,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "market_card",
          strict: true,
          schema: WIRE_SCHEMA,
        },
      },
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error(`OpenRouter returned an empty response for ${ticker}`);
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`OpenRouter returned non-JSON output for ${ticker}`);
    }

    const parsed = CardDataSchema.safeParse(raw);
    if (parsed.success) {
      return { ...parsed.data, ticker: ticker.toUpperCase() };
    }

    const problem = z.prettifyError(parsed.error);

    if (attempt === 1) {
      throw new Error(
        `OpenRouter output failed schema validation for ${ticker} after repair: ${problem}`,
      );
    }

    console.warn(`[ai] repairing malformed card for ${ticker}: ${problem}`);
    messages.push(
      { role: "assistant", content: text },
      {
        role: "user",
        content: `That response failed validation:\n${problem}\n\nReturn the corrected JSON object. Array lengths are exact: thesis must have exactly 3 items, catalysts exactly 2, risks exactly 2.`,
      },
    );
  }

  // Unreachable: the loop either returns or throws on its second pass.
  throw new Error(`Card generation failed for ${ticker}`);
}
