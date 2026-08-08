"use client";

import { motion } from "framer-motion";

import SwipeCard, { type SwipeCardHandle } from "./SwipeCard";
import type { CardData, SwipeDirection } from "@/types/card";

/** How many cards are rendered at once. The rest wait in state. */
const VISIBLE = 3;

interface CardStackProps {
  cards: CardData[];
  /** Absolute index of the top card, used to keep React keys stable. */
  startIndex: number;
  onSwipe: (direction: SwipeDirection) => void;
  topCardRef: React.Ref<SwipeCardHandle>;
}

export default function CardStack({
  cards,
  startIndex,
  onSwipe,
  topCardRef,
}: CardStackProps) {
  const visible = cards.slice(0, VISIBLE);

  return (
    <div className="relative h-full w-full">
      {visible.map((card, depth) => {
        const isTop = depth === 0;
        return (
          <motion.div
            key={`${card.ticker}-${startIndex + depth}`}
            className="absolute inset-0"
            style={{ zIndex: VISIBLE - depth }}
            initial={{ scale: 1 - depth * 0.05, y: depth * 14, opacity: 0 }}
            animate={{
              scale: 1 - depth * 0.05,
              y: depth * 14,
              opacity: depth === VISIBLE - 1 ? 0.5 : 1,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <SwipeCard
              card={card}
              onSwipe={onSwipe}
              interactive={isTop}
              {...(isTop ? { ref: topCardRef } : {})}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
