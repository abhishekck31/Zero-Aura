"use client";

import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useImperativeHandle, useRef } from "react";

import type { CardData, SwipeDirection } from "@/types/card";

/** Horizontal distance, in px, past which a release commits the swipe. */
const SWIPE_THRESHOLD = 150;
/** A fast flick commits even when it never travelled the full threshold. */
const FLICK_VELOCITY = 550;

/**
 * Framer Motion 13 does not re-export `PanInfo` from the package root — it
 * lives in the transitive `motion-dom` package, which isn't a declared
 * dependency here. Typing the handler structurally keeps us off that import.
 */
interface DragInfo {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface SwipeCardHandle {
  /** Commit a swipe programmatically, e.g. from the on-screen buttons. */
  swipe: (direction: SwipeDirection) => void;
}

interface SwipeCardProps {
  card: CardData;
  onSwipe: (direction: SwipeDirection) => void;
  /** Only the top card is interactive; the ones behind are inert scenery. */
  interactive?: boolean;
  ref?: React.Ref<SwipeCardHandle>;
}

export default function SwipeCard({
  card,
  onSwipe,
  interactive = true,
  ref,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  /** Guards against a button press and a drag release both committing. */
  const committed = useRef(false);

  // Every visual response below is derived from `x` directly. Driving them
  // through React state instead would re-render the card on every pointer
  // move and visibly stutter the drag.
  const rotate = useTransform(x, [-220, 0, 220], [-16, 0, 16]);
  const bullGlow = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const bearGlow = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const bullStamp = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const bearStamp = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);
  const bullTint = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.14]);
  const bearTint = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.14, 0]);

  const commit = useCallback(
    async (direction: SwipeDirection) => {
      if (committed.current) return;
      committed.current = true;

      await controls.start({
        x: direction === "bullish" ? 620 : -620,
        opacity: 0,
        transition: reduceMotion
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
      });

      // Fire only after the card has physically left, so the parent unmounts
      // it at the end of the exit rather than mid-flight.
      onSwipe(direction);
    },
    [controls, onSwipe, reduceMotion],
  );

  useImperativeHandle(ref, () => ({ swipe: commit }), [commit]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: DragInfo) => {
      const offset = x.get();
      const velocity = info.velocity.x;

      const passedDistance = Math.abs(offset) > SWIPE_THRESHOLD;
      const passedFlick =
        Math.abs(velocity) > FLICK_VELOCITY && Math.sign(velocity) === Math.sign(offset);

      if (passedDistance || passedFlick) {
        void commit(offset > 0 ? "bullish" : "bearish");
      }
      // Otherwise `dragSnapToOrigin` springs it home on its own.
    },
    [commit, x],
  );

  return (
    <motion.div
      className="no-drag-select relative h-full w-full"
      style={{ x, rotate }}
      animate={controls}
      drag={interactive ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.55}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing", scale: 1.02 }}
    >
      {/*
        The signature: the aura. At rest it is literally zero — the product's
        name — and taking a position blooms coloured light out from behind the
        card. Sits outside the card's clip so it spills around the silhouette.
      */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[999px] bg-bull blur-3xl"
        style={{ opacity: bullGlow }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[999px] bg-bear blur-3xl"
        style={{ opacity: bearGlow }}
      />

      <article className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_24px_70px_-20px_rgba(0,0,0,0.9)]">
        {/* Directional tint across the card face itself. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 bg-bull"
          style={{ opacity: bullTint }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 bg-bear"
          style={{ opacity: bearTint }}
        />

        {/* Verdict stamps, in the dating-app idiom but set in terminal type. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-7 left-6 z-30 -rotate-12 rounded-lg border-[3px] border-bull px-3 py-1 font-mono text-xl font-bold tracking-[0.18em] text-bull"
          style={{ opacity: bullStamp }}
        >
          BULLISH
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-7 right-6 z-30 rotate-12 rounded-lg border-[3px] border-bear px-3 py-1 font-mono text-xl font-bold tracking-[0.18em] text-bear"
          style={{ opacity: bearStamp }}
        >
          BEARISH
        </motion.div>

        <header className="shrink-0 border-b border-line px-6 pt-6 pb-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-3xl font-semibold tracking-tight text-paper">
              {card.ticker}
            </span>
            <span className="truncate text-right text-xs text-muted">
              {card.companyName}
            </span>
          </div>
          <h2 className="mt-3 font-display text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-paper">
            {card.headline}
          </h2>
        </header>

        <div className="card-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <ul className="space-y-3.5">
            {card.thesis.map((line) => (
              <li
                key={line}
                className="border-l-2 border-line pl-3.5 text-[13.5px] leading-relaxed text-paper/85"
              >
                {line}
              </li>
            ))}
          </ul>

          <Section
            label="Catalysts"
            items={card.catalysts}
            tone="bull"
            icon={<TrendingUp className="size-3.5" strokeWidth={2.5} />}
          />
          <Section
            label="Risks"
            items={card.risks}
            tone="bear"
            icon={<TrendingDown className="size-3.5" strokeWidth={2.5} />}
          />
        </div>
      </article>
    </motion.div>
  );
}

function Section({
  label,
  items,
  tone,
  icon,
}: {
  label: string;
  items: string[];
  tone: "bull" | "bear";
  icon: React.ReactNode;
}) {
  const accent = tone === "bull" ? "text-bull" : "text-bear";
  return (
    <section className="mt-5">
      <h3
        className={`flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.22em] uppercase ${accent}`}
      >
        {icon}
        {label}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] leading-snug text-paper/75"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
