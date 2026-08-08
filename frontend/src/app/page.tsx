"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import AuraMeter from "./components/AuraMeter";
import CardStack from "./components/CardStack";
import ControlPanel, {
  type LogChannel,
  type LogLine,
} from "./components/ControlPanel";
import EmptyState from "./components/EmptyState";
import ShareAura from "./components/ShareAura";
import type { SwipeCardHandle } from "./components/SwipeCard";
import { useAura } from "@/hooks/useAura";
import { API_BASE, fetchFeed, fetchHealth } from "@/lib/api";
import type { CardData, DeckSource, SwipeDirection } from "@/types/card";

const DECK_SIZE = 6;
/** How long an auto-swipe waits between cards in Doomscroll mode. */
const DOOMSCROLL_INTERVAL = 4000;
const TOAST_LIFETIME = 800;

type Status = "loading" | "ready" | "error";

interface AuraToast {
  id: number;
  delta: number;
  direction: SwipeDirection;
}

export default function Home() {
  const [deck, setDeck] = useState<CardData[]>([]);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ bullish: 0, bearish: 0 });
  const [status, setStatus] = useState<Status>("loading");
  const [source, setSource] = useState<DeckSource>("ai");
  const [liveCount, setLiveCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const { score, award } = useAura();
  const [toasts, setToasts] = useState<AuraToast[]>([]);
  const [doomscroll, setDoomscroll] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [health, setHealth] = useState<{
    mode: "ai" | "mock";
    model: string | null;
  } | null>(null);

  const topCardRef = useRef<SwipeCardHandle>(null);
  const toastId = useRef(0);
  const logId = useRef(0);
  /** Marks the next swipe as machine-driven, so only those shake the screen. */
  const autoSwipe = useRef(false);
  /** Read inside the interval, which must not close over a stale deck length. */
  const remainingCount = useRef(0);

  /** Appends a trace line for the control panel. Capped so it can't grow forever. */
  const log = useCallback((channel: LogChannel, message: string) => {
    const id = (logId.current += 1);
    setLogs((current) => [...current, { id, channel, message }].slice(-12));
  }, []);

  const loadDeck = useCallback(
    async (options: { refresh?: boolean; signal?: AbortSignal } = {}) => {
      const { refresh = false, signal } = options;
      setStatus("loading");
      setErrorMessage("");
      log("SYSTEM", refresh ? "regenerating deck…" : "fetching feed…");
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

        log(
          "SYSTEM",
          `feed resolved — ${feed.cards.length} cards, ${feed.liveCount}/${feed.total} live`,
        );
        const cached = feed.cards.filter((card) => card.cachedAt).length;
        if (cached > 0) log("CACHE", `${cached} card(s) served from disk`);
        const fallbacks = feed.cards.filter((c) => c.source === "mock").length;
        if (fallbacks > 0) {
          log("ENGINE", `${fallbacks} card(s) fell back to curated deck`);
        }
      } catch (error) {
        if (signal?.aborted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong.",
        );
        setStatus("error");
        log("SYSTEM", "feed unreachable — api offline");
      }
    },
    [log],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadDeck({ signal: controller.signal });
    return () => controller.abort();
  }, [loadDeck]);

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((result) => {
        setHealth({ mode: result.mode, model: result.model });
        log(
          "ENGINE",
          result.mode === "ai"
            ? `engine online — ${result.model}`
            : "engine in mock mode — no api key",
        );
      })
      .catch(() => {
        /* The feed's own error path already reports an unreachable API. */
      });
    return () => controller.abort();
  }, [log]);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      setIndex((current) => current + 1);
      setTally((current) => ({
        ...current,
        [direction]: current[direction] + 1,
      }));

      const delta = award(direction);
      const id = (toastId.current += 1);
      setToasts((current) => [...current, { id, delta, direction }]);
      window.setTimeout(
        () => setToasts((current) => current.filter((t) => t.id !== id)),
        TOAST_LIFETIME,
      );
      log(
        "AURA",
        `${direction} — ${delta > 0 ? "+" : ""}${delta} delta verified`,
      );

      if (autoSwipe.current) {
        autoSwipe.current = false;
        setShaking(true);
        window.setTimeout(() => setShaking(false), 200);
      }

      if (direction === "bullish") void celebrate();
    },
    [award, log],
  );

  const remaining = deck.slice(index);
  const isDeckEmpty = status === "ready" && remaining.length === 0;

  useEffect(() => {
    remainingCount.current = remaining.length;
  }, [remaining.length]);

  // Stop Doomscroll when the deck runs out, rather than leaving a live timer
  // firing against a card that is no longer mounted.
  useEffect(() => {
    if (isDeckEmpty) setDoomscroll(false);
  }, [isDeckEmpty]);

  useEffect(() => {
    if (!doomscroll || status !== "ready") return;

    const timer = window.setInterval(() => {
      if (remainingCount.current <= 0) return;
      autoSwipe.current = true;
      topCardRef.current?.swipe(Math.random() < 0.5 ? "bullish" : "bearish");
    }, DOOMSCROLL_INTERVAL);

    return () => window.clearInterval(timer);
  }, [doomscroll, status]);

  const hasCards = status === "ready" && remaining.length > 0;

  return (
    <main
      className={`relative grid min-h-dvh w-full grid-cols-1 gap-6 overflow-hidden bg-ink p-4 text-paper lg:grid-cols-12 lg:p-8 ${
        shaking ? "animate-shake" : ""
      }`}
    >
      <AmbientField />
      <AuraToasts toasts={toasts} />

      <ControlPanel
        score={score}
        cardsSwiped={Math.min(index, deck.length)}
        deckSize={deck.length}
        source={source}
        liveCount={liveCount}
        total={deck.length}
        tally={tally}
        model={health?.model ?? null}
        mode={health?.mode ?? null}
        logs={logs}
      />

      {/* Arena. Full width on mobile, 7 of 12 on desktop. */}
      <section className="relative z-10 col-span-1 flex min-h-[80dvh] flex-col items-center justify-center lg:col-span-7 lg:h-[calc(100dvh-4rem)] lg:min-h-0">
        <div className="flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
          <header className="w-full shrink-0 space-y-3">
            <div className="flex items-center justify-between">
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
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AuraMeter score={score} />
                <ShareAura score={score} />
              </div>
              <DoomscrollToggle
                active={doomscroll}
                disabled={!hasCards}
                onToggle={() => {
                  // Derived outside the updater on purpose: state updaters must
                  // stay pure, and StrictMode double-invokes them in dev, which
                  // would log every toggle twice.
                  const next = !doomscroll;
                  setDoomscroll(next);
                  log(
                    "ENGINE",
                    next
                      ? "auto-doomscroll engaged — 4s cadence"
                      : "auto-doomscroll disengaged",
                  );
                }}
              />
            </div>
          </header>

          {/* Flexes instead of a fixed height: on a short laptop the card
              shrinks and its internal scroll absorbs it, rather than the
              action buttons being clipped off the bottom. */}
          <div className="mt-5 max-h-[600px] min-h-[360px] w-full flex-1">
            {status === "loading" && <LoadingState />}
            {status === "error" && (
              <ErrorState
                message={errorMessage}
                onRetry={() => void loadDeck()}
              />
            )}
            {isDeckEmpty && (
              <EmptyState
                bullish={tally.bullish}
                bearish={tally.bearish}
                onReset={() => void loadDeck({ refresh: true })}
              />
            )}
            {hasCards && (
              <CardStack
                cards={remaining}
                startIndex={index}
                onSwipe={handleSwipe}
                topCardRef={topCardRef}
              />
            )}
          </div>

          {hasCards && (
            <div className="shrink-0">
              <div className="mt-7 flex items-center justify-center gap-5">
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

              <p className="mt-5 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                <ArrowLeft className="size-3" /> Bearish
                <span className="text-line">·</span>
                Bullish <ArrowRight className="size-3" />
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Aura change feedback, floated over the deck.
 *
 * Keyed by an incrementing id rather than by direction, so two swipes the same
 * way still produce two distinct entries — AnimatePresence needs a new key to
 * replay the animation. The layer never takes pointer events, or it would
 * swallow the drag it is reacting to.
 */
function AuraToasts({ toasts }: { toasts: AuraToast[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const bullish = toast.direction === "bullish";
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -28, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`rounded-full border px-4 py-2 font-mono text-sm font-bold tracking-[0.08em] backdrop-blur-md ${
                bullish
                  ? "border-bull/50 bg-bull/15 text-bull"
                  : "border-bear/50 bg-bear/15 text-bear"
              }`}
            >
              {bullish
                ? `⚡ +${toast.delta} AURA // GIGACHAD MOVE`
                : `🚨 ${toast.delta} AURA // COOKED BY MARKET`}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function DoomscrollToggle({
  active,
  disabled,
  onToggle,
}: {
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[9px] tracking-[0.14em] uppercase transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-bull bg-bull/15 text-bull shadow-[0_0_14px_-2px_var(--color-bull)]"
          : "border-line bg-surface/80 text-muted hover:border-paper/40 hover:text-paper"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          active ? "animate-pulse bg-bull" : "bg-muted"
        }`}
      />
      🎰 Auto&#8209;Doomscroll
    </button>
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
