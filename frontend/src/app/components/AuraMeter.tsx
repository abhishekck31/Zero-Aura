"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AuraMeterProps {
  score: number;
}

/**
 * Arcade-style score badge. The number counts up to its new value rather than
 * snapping, so a +50 registers as movement in peripheral vision while the
 * user is still watching the card fly off.
 */
export default function AuraMeter({ score }: AuraMeterProps) {
  const [display, setDisplay] = useState(score);
  // Tracks the animated value between runs so an interrupted count-up resumes
  // from where it stopped instead of jumping back to the last committed score.
  const from = useRef(score);

  useEffect(() => {
    const controls = animate(from.current, score, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (value) => {
        from.current = value;
        setDisplay(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [score]);

  return (
    <div className="relative flex items-center gap-2.5 rounded-lg border border-bull/30 bg-surface/80 px-3 py-1.5">
      {/* Pulsing glow, behind the badge and out of the accessibility tree. */}
      <span
        aria-hidden
        className="animate-aura-pulse pointer-events-none absolute -inset-px rounded-lg bg-bull/10 blur-[6px]"
      />

      <span
        aria-hidden
        className="relative size-1.5 rounded-full bg-bull shadow-[0_0_8px_var(--color-bull)]"
      />

      <span className="relative font-mono text-lg leading-none font-semibold tabular-nums text-paper">
        {display.toLocaleString()}
      </span>

      <span className="relative font-mono text-[9px] leading-none tracking-[0.2em] text-bull uppercase">
        Aura
      </span>
    </div>
  );
}
