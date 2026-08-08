# ⚡ Zero-Aura

Market events, cut down to a card you can swipe. Right for bullish, left for bearish.

Dense corporate disclosure — earnings calls, shareholder letters — goes in. A structured,
Gen-Z-voiced swipe card comes out, rendered as a physics-driven deck.

Built as a proof of concept for the **67 Labs / OpenTrade (YC S26)** product loop.

---

## How it works

```
transcript ──▶ Zod schema ──▶ JSON Schema ──▶ OpenRouter ──▶ Zod parse ──▶ disk cache ──▶ deck
                    │                                            │
                    └──────────── same source of truth ──────────┘
```

`CardDataSchema` is the single source of truth in both directions. It compiles to the JSON
Schema sent as the model's output constraint, then validates the response on the way back.
Field descriptions survive that conversion and reach the model as per-field instructions.

Every card is exactly one ticker, one headline, **3** thesis lines, **2** catalysts, **2** risks.

## Tech stack

| Layer | What's actually used |
|---|---|
| Frontend | Next.js **16** (App Router), React **19**, TypeScript, Framer Motion **13**, Tailwind CSS **v4** |
| Backend | Node.js, Express **5**, TypeScript, Zod **4** |
| AI | OpenRouter via the `openai` SDK — model is a config value |

Tailwind v4 is configured in CSS (`@theme` in `globals.css`); there is no `tailwind.config` file.

## Getting started

Two processes. Backend first.

```bash
# backend — http://localhost:4000
cd backend
npm install
cp .env.example .env        # then paste your OpenRouter key into .env
npm run dev

# frontend — http://localhost:3000
cd frontend
npm install
npm run dev
```

Without a key the API still runs and serves a curated fallback deck, so the app works offline.

> Editing `.env` alone will not reload the server — `tsx watch` only watches `.ts` files.
> Restart it, or touch a source file.

### Environment

`backend/.env` (gitignored — never put a real key in `.env.example`, which is committed):

| Variable | Default | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | — | Blank runs the API in mock mode |
| `OPENROUTER_MODEL` | `google/gemma-4-26b-a4b-it:free` | Must support structured outputs |
| `PORT` | `4000` | |
| `CORS_ORIGIN` | `http://localhost:3000` | |

`frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000`

## API

**`GET /api/cards/feed?limit=6&refresh=false`** — a whole deck in one round trip. Tickers are
sampled, so decks vary between loads. `refresh=true` bypasses the cache and regenerates.

```jsonc
{
  "cards": [{ "ticker": "NVDA", "headline": "...", "thesis": ["...","...","..."],
              "catalysts": ["...","..."], "risks": ["...","..."], "source": "ai" }],
  "source": "ai",      // "ai" | "partial" | "mock"
  "liveCount": 6,
  "total": 6
}
```

**`POST /api/cards/generate`** — one card from `{ ticker, rawText }`. Uncached, since the caller
supplies arbitrary text.

**`GET /health`** — reports whether the server resolved to AI or mock mode, and which model.

## Notes on the build

**Nothing fails hard.** Cards generate in parallel via `Promise.allSettled`, so one bad ticker
costs one card rather than the deck. Each card reports its own `source`, and the UI says
"4 of 6 live" rather than writing the whole deck off as offline.

**Generated cards are cached to disk.** A six-card deck is six API calls and free tiers are
counted per day, so reloads would burn quota fast. Cache entries record the model that produced
them and are dropped when it changes — otherwise a provider swap would keep serving the old
model's cards and look like it worked.

**The drag never re-renders React.** Rotation, tint, stamps and the aura all read from one
`MotionValue`. Committing at 150px *or* on a fast flick is what makes a short quick gesture read
as a swipe instead of an ignored drag.

**Array lengths are belt-and-braces.** The OpenAI-compatible strict schema dialect rejects
`minItems`/`maxItems`, so the wire schema drops them while Zod keeps them. A validation failure
triggers one repair retry that hands the model its own output and the error; second failure falls
back to a curated card.

## Limitations

Worth stating plainly:

- **The market data is synthetic.** `backend/src/data/mockTranscripts.ts` holds 15 hand-written
  transcripts with invented figures. No live feed is wired up. The pipeline is real; the inputs
  are not.
- **Swipes aren't persisted.** No accounts, no portfolio, no scoring against actual price action.
  Every swipe is discarded on reload.
- Not investment advice, and not a trading product.

---

*Built for the OpenTrade product loop.*
