"use client";

import { RotateCcw } from "lucide-react";

interface EmptyStateProps {
  bullish: number;
  bearish: number;
  onReset: () => void;
}

export default function EmptyState({
  bullish,
  bearish,
  onReset,
}: EmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-line px-8 text-center">
      <p className="font-mono text-[10px] tracking-[0.28em] text-muted uppercase">
        Deck cleared
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight font-bold tracking-[-0.02em] text-paper">
        That&rsquo;s the whole tape.
      </h2>

      <div className="mt-7 flex items-stretch gap-3">
        <Tally value={bullish} label="Bullish" tone="bull" />
        <Tally value={bearish} label="Bearish" tone="bear" />
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-8 flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
      >
        <RotateCcw className="size-4" strokeWidth={2.5} />
        Deal a new deck
      </button>
    </div>
  );
}

function Tally({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "bull" | "bear";
}) {
  const accent = tone === "bull" ? "text-bull" : "text-bear";
  return (
    <div className="min-w-24 rounded-2xl border border-line bg-surface px-5 py-4">
      <p className={`font-mono text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}
