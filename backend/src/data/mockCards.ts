import type { CardData } from "../services/aiService.js";

/**
 * Hand-written fallback deck.
 *
 * Served whenever OPENROUTER_API_KEY is absent or the API call fails, so a flaky
 * network never produces an empty demo. Every figure here is drawn from the
 * matching entry in `mockTranscripts.ts` and is therefore SYNTHETIC — these are
 * illustrative cards about invented events, not real market data.
 *
 * Keyed by ticker so the route can fall back per-card rather than all-or-nothing.
 */
export const mockCards: Record<string, CardData> = {
  NVDA: {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    headline: "Jensen cooked again, nobody's close",
    thesis: [
      "Data center did $30.8 billion, up 94% year over year — the aura here is genuinely unmatched rn",
      "Blackwell is in full production and demand still exceeds supply, so they're printing with the brakes on",
      "75.1% gross margin on hardware is free money glitch behavior, that's a software margin on physical silicon",
    ],
    catalysts: [
      "Q4 guidance of $37.5 billion came in above the $37.1 billion consensus",
      "Management expects supply to stay tight for the next four quarters, which holds pricing power",
    ],
    risks: [
      "Four hyperscalers are roughly 46% of data center revenue — if any of them build in-house, that concentration cuts deep",
      "Advanced packaging lead times are the stated bottleneck on shipments, so demand doesn't convert to revenue on schedule",
    ],
  },
  TSLA: {
    ticker: "TSLA",
    companyName: "Tesla, Inc.",
    headline: "Cars mid, batteries locked in",
    thesis: [
      "462,890 deliveries against a 470,000 estimate — the growth story on the auto side is straight up cooked for now",
      "Energy storage did 14.2 GWh, up 78% to a company record, and nobody is pricing that as the actual business",
      "Cutting prices to move metal while margin bleeds is not the flex the timeline thinks it is",
    ],
    catalysts: [
      "Energy storage deployments up 78% year over year to a record 14.2 GWh",
      "Next-generation affordable vehicle still guided to production in the second half of next year",
    ],
    risks: [
      "Auto gross margin ex-credits fell to 15.4% from 17.1%, so every price cut is landing directly on the P&L",
      "Regulatory credit revenue dropped 34% to $580 million, removing a pure-margin cushion that was holding up earnings",
    ],
  },
  PLTR: {
    ticker: "PLTR",
    companyName: "Palantir Technologies Inc.",
    headline: "Business clutched, valuation down bad",
    thesis: [
      "US commercial up 54% with customer count up 77% — they finally proved it's not just a government contractor",
      "38% adjusted operating margin from 29% a year ago means the operating leverage is real, not a slide",
      "Nobody is arguing the business is bad, everyone is arguing about the multiple, and that's a different fight",
    ],
    catalysts: [
      "Full-year revenue guidance raised to $2.80–$2.81 billion",
      "104 deals closed above $1 million and 36 above $5 million, with RPO at $1.57 billion",
    ],
    risks: [
      "Roughly 55x forward sales prices in years of flawless execution, so any single soft quarter is a long way down",
      "Government still carries $408 million of the quarter, leaving revenue exposed to procurement cycles and budget timing",
    ],
  },
  COIN: {
    ticker: "COIN",
    companyName: "Coinbase Global, Inc.",
    headline: "Revenue doubled, still a beta bet",
    thesis: [
      "Revenue up 79% to $1.45 billion — when crypto is bullish these guys are the toll booth and it's not close",
      "Subscription and services at $556 million up 66% is the actually interesting line, that's the non-degenerate revenue",
      "The whole thesis is just 'do you think volatility continues', everything else is downstream of that",
    ],
    catalysts: [
      "Stablecoin revenue reached $247 million within a $556 million subscription and services line",
      "Institutional flow now represents 68% of the $185 billion in trading volume",
    ],
    risks: [
      "Management states outright that revenue is highly correlated to crypto prices and volatility, so a quiet market is an earnings problem",
      "Operating expenses climbed 24% sequentially to $1.1 billion, meaning the cost base scales up faster than a downturn can be absorbed",
    ],
  },
  NFLX: {
    ticker: "NFLX",
    companyName: "Netflix, Inc.",
    headline: "Ads tier clutched the whole quarter",
    thesis: [
      "Operating margin at 22.2% from 16.9% — they stopped buying growth and started actually converting it, genuinely bullish",
      "Ad tier is over 40% of new sign-ups across twelve markets with 70 million MAUs, that's a second business forming in public",
      "Raising prices while margin expands means they know exactly how much pricing power they have",
    ],
    catalysts: [
      "Price increases announced across standard and premium plans in the US, Canada, and the UK",
      "Full-year operating margin guided to 29%, with $6.9 billion of free cash flow for the year",
    ],
    risks: [
      "Average revenue per membership grew only 1% year over year, so the growth is volume, not pricing, and volume eventually caps",
      "Content amortization is guided to rise as live sports commitments scale, which pressures the same margin line they just expanded",
    ],
  },
  AAPL: {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    headline: "Services carrying, iPhone slightly cooked",
    thesis: [
      "Services hit $26.3 billion up 14% at 75% gross margin — the hardware company is quietly a software company now",
      "iPhone at $69.1 billion missed the $71.0 billion estimate and shrank year over year, the supercycle is not showing up",
      "2.35 billion active devices is the moat, everything else is just deciding how to monetize an installed base nobody can dislodge",
    ],
    catalysts: [
      "All-time record total revenue of $124.3 billion, up 4% year over year",
      "Markets with Apple Intelligence available showed stronger year-over-year iPhone performance than markets without it",
    ],
    risks: [
      "Greater China revenue fell 11% to $18.5 billion, and that decline has now persisted across multiple quarters",
      "iPhone is still the majority of revenue and it declined 1% year over year, so Services has to keep outrunning the core product",
    ],
  },
};

/** Ordered fallback deck, matching the order of `mockTranscripts`. */
export const mockCardDeck: CardData[] = [
  "NVDA",
  "TSLA",
  "PLTR",
  "COIN",
  "NFLX",
  "AAPL",
].map((ticker) => {
  const card = mockCards[ticker];
  if (!card) throw new Error(`Missing mock card for ${ticker}`);
  return card;
});
