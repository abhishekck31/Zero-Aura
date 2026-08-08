"use client";

import { useCallback, useEffect, useState } from "react";

import type { SwipeDirection } from "@/types/card";

const STORAGE_KEY = "zero-aura:score";
export const STARTING_AURA = 1000;

/**
 * Aura awarded per swipe. Bearish costs more than bullish gains — the score is
 * a measure of conviction, not accuracy, since there is no price outcome to
 * grade against. The floor at zero keeps a long Auto-Doomscroll run from
 * driving the number absurdly negative.
 */
export const AURA_DELTA: Record<SwipeDirection, number> = {
  bullish: 50,
  bearish: -100,
};

export interface AuraState {
  score: number;
  /** Applies the delta for a direction and returns it, for display. */
  award: (direction: SwipeDirection) => number;
  reset: () => void;
}

export function useAura(): AuraState {
  const [score, setScore] = useState(STARTING_AURA);

  // `hydrated` gates persistence rather than a ref, and that matters: both
  // effects run in the same commit on mount, so a ref set inside the loader
  // would already read true when the writer runs, and the writer would flush
  // the default 1000 over the stored value before the loaded state landed.
  const [hydrated, setHydrated] = useState(false);

  // Read on mount, never during render — touching localStorage while rendering
  // desyncs the server and client HTML and trips a hydration error.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed)) {
          setScore(Math.max(0, Math.trunc(parsed)));
        }
      }
    } catch {
      // Private mode or a blocked store: fall back to the starting score.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(score));
    } catch {
      // Persistence is best-effort; the session still works without it.
    }
  }, [score, hydrated]);

  const award = useCallback((direction: SwipeDirection) => {
    const delta = AURA_DELTA[direction];
    setScore((current) => Math.max(0, current + delta));
    return delta;
  }, []);

  const reset = useCallback(() => setScore(STARTING_AURA), []);

  return { score, award, reset };
}
