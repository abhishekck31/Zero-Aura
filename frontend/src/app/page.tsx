"use client";

import { ArrowLeft, ArrowRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import CardStack from "./components/CardStack";
import EmptyState from "./components/EmptyState";
import type { SwipeCardHandle } from "./components/SwipeCard";
import { API_BASE, fetchFeed } from "@/lib/api";
import type { CardData, DeckSource, SwipeDirection } from "@/types/card";

const DECK_SIZE = 6;

type Status = "loading" | "ready" | "error";

export default function Home() {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ bullish: 0, bearish: 0 });
  const [status, setStatus] = useState<Status>("loading");
  const [source, setSource] = useState<DeckSource>("ai");
  const [liveCount, setLiveCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const topCardRef = useRef<SwipeCardHandle>(null);

  const loadDeck = useCallback(
    async (options: { refresh?: boolean; signal?: AbortSignal } = {}) => {
      const { refresh = false, signal } = options;
      setStatus("loading");
      setErrorMessage("");
      try {
        const feed = await fetchFeed({
          limit: DECK_SIZE,
          refresh,
          ...(signal ? { signal } : {}),
        });
        setDeck(feed.cards);
        setSource(feed.source);
        setLiveCount(feed.liveCount);
        setIndex(0);
        setTally({ bullish: 0, bearish: 0 });
        setStatus("ready");
      } catch (error) {
        if (signal?.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong.",
        );
        setStatus("error");
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDeck({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDeck]);

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    setIndex((current) => current + 1);
    setTally((current) => ({
      ...current,
      [direction]: current[direction] + 1,
    }));

    if (direction === "bullish") void celebrate();
  }, []);

  const remaining = deck.slice(index);
  const isDeckEmpty = status === "ready" && remaining.length === 0;

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-5 py-6">
      <AmbientField />

      <header className="z-10 flex w-full max-w-sm items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-extrabold tracking-[-0.03em] text-paper">
            Zero&#8209;Aura
          </span>
          <SourceBadge
            source={source}
            liveCount={liveCount}
            total={deck.length}
          />
        </div>
        <span className="font-mono text-[11px] text-muted tabular-nums">
          {status === "ready" && deck.length > 0
            ? `${Math.min(index + 1, deck.length)} / ${deck.length}`
            : "—"}
        </span>
      </header>

      <section className="z-10 mt-5 h-[560px] w-full max-w-sm sm:h-[600px]">
        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState message={errorMessage} onRetry={() => void loadDeck()} />
        )}
        {isDeckEmpty && (
          <EmptyState
            bullish={tally.bullish}
            bearish={tally.bearish}
            onReset={() => void loadDeck({ refresh: true })}
          />
        )}
        {status === "ready" && remaining.length > 0 && (
          <CardStack
            cards={remaining}
            startIndex={index}
            onSwipe={handleSwipe}
            topCardRef={topCardRef}
          />
        )}
      </section>

      {status === "ready" && remaining.length > 0 && (
        <>
          <div className="z-10 mt-7 flex items-center gap-5">
            <ActionButton
              tone="bear"
              label="Swipe bearish"
              onClick={() => topCardRef.current?.swipe("bearish")}
            >
              <TrendingDown className="size-6" strokeWidth={2.5} />
            </ActionButton>
            <ActionButton
              tone="bull"
              label="Swipe bullish"
              onClick={() => topCardRef.current?.swipe("bullish")}
            >
              <TrendingUp className="size-6" strokeWidth={2.5} />
            </ActionButton>
          </div>

          <p className="z-10 mt-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            <ArrowLeft className="size-3" /> Bearish
            <span className="text-line">·</span>
            Bullish <ArrowRight className="size-3" />
          </p>
        </>
      )}
    </main>
  );
}

/**
 * Reports deck provenance honestly: a partly-degraded deck says so rather than
 * being written off wholesale as offline.
 */
function SourceBadge({
  source,
  liveCount,
  total,
}: {
  source: DeckSource;
  liveCount: number;
  total: number;
}) {
  const label =
    source === "ai"
      ? "Live"
      : source === "partial"
        ? `${liveCount} of ${total} live`
        : "Offline deck";

  const tone =
    source === "ai"
      ? "text-bull"
      : source === "partial"
        ? "text-paper/70"
        : "text-muted";

  return (
    <span
      className={`font-mono text-[9px] tracking-[0.2em] uppercase ${tone}`}
      title={
        source === "mock"
          ? "Gemini was unavailable — showing the curated fallback deck"
          : undefined
      }
    >
      {label}
    </span>
  );
}

/**
 * Two soft plum blooms behind everything. Static and very low contrast — the
 * page should look like it's already glowing faintly before any card does.
 */
function AmbientField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-32 -left-24 size-96 rounded-full bg-[#3a2a6b] opacity-25 blur-[100px]" />
      <div className="absolute -right-24 -bottom-32 size-96 rounded-full bg-[#5b2350] opacity-20 blur-[100px]" />
    </div>
  );
}

function ActionButton({
  tone,
  label,
  onClick,
  children,
}: {
  tone: "bull" | "bear";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === "bull"
      ? "border-bull/35 text-bull hover:border-bull hover:bg-bull/10"
      : "border-bear/35 text-bear hover:border-bear hover:bg-bear/10";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex size-16 items-center justify-center rounded-full border-2 bg-surface/70 backdrop-blur-sm transition active:scale-90 ${toneClasses}`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[28px] border border-line bg-surface/40">
      <Loader2 className="size-6 animate-spin text-muted" />
      <p className="font-mono text-[10px] tracking-[0.24em] text-muted uppercase">
        Reading the tape
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-bear/40 px-8 text-center">
      <p className="font-mono text-[10px] tracking-[0.24em] text-bear uppercase">
        No deck
      </p>
      <h2 className="mt-3 font-display text-2xl leading-tight font-bold text-paper">
        Can&rsquo;t reach the API.
      </h2>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <p className="mt-2 font-mono text-[11px] text-muted">
        Start it with <span className="text-paper">npm run dev</span> in{" "}
        <span className="text-paper">backend/</span>, listening on {API_BASE}.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
      >
        Try again
      </button>
    </div>
  );
}

/**
 * Confetti burst on a bullish swipe. Imported on demand so the library stays
 * out of the initial bundle, and skipped entirely when the user has asked for
 * reduced motion.
 */
async function celebrate() {
  if (
    typeof window === "undefined" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const { default: confetti } = await import("canvas-confetti");
  const shared = {
    particleCount: 60,
    spread: 70,
    startVelocity: 45,
    ticks: 180,
    colors: ["#c3f53c", "#f3f0f8", "#8c8499"],
    disableForReducedMotion: true,
  };

  confetti({ ...shared, angle: 60, origin: { x: 0, y: 0.75 } });
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 0.75 } });
}
