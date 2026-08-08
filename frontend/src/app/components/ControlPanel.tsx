"use client";

import type { DeckSource } from "@/types/card";

export type LogChannel = "SYSTEM" | "ENGINE" | "AURA" | "CACHE";

export interface LogLine {
  id: number;
  channel: LogChannel;
  message: string;
}

interface ControlPanelProps {
  score: number;
  cardsSwiped: number;
  deckSize: number;
  source: DeckSource;
  liveCount: number;
  total: number;
  tally: { bullish: number; bearish: number };
  model: string | null;
  mode: "ai" | "mock" | null;
  logs: LogLine[];
}

/** Score bands, so the status line means something rather than always reading HIGH. */
function auraBand(score: number): string {
  if (score >= 2000) return "TRANSCENDENT AURA";
  if (score >= 1250) return "HIGH AURA";
  if (score >= 750) return "STABLE AURA";
  if (score >= 250) return "AURA LEAKING";
  return "ZERO AURA";
}

/**
 * Desktop-only terminal panel. Hidden below `lg`, where the arena takes the
 * full viewport — so it holds no controls, only readouts. Anything actionable
 * lives in the arena header where every breakpoint can reach it.
 */
export default function ControlPanel({
  score,
  cardsSwiped,
  deckSize,
  source,
  liveCount,
  total,
  tally,
  model,
  mode,
  logs,
}: ControlPanelProps) {
  const sourceLabel =
    total === 0
      ? "AWAITING FEED"
      : source === "ai"
        ? `${liveCount}/${total} LIVE`
        : source === "partial"
          ? `${liveCount}/${total} LIVE // DEGRADED`
          : "CURATED FALLBACK";

  return (
    <aside className="hidden rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur-md lg:col-span-5 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:justify-between">
      <header className="shrink-0">
        <h2 className="font-mono text-xs tracking-widest text-muted uppercase">
          ⚡ System Control Center
        </h2>
        <div className="mt-4 h-px w-full bg-line" />
      </header>

      <div className="min-h-0 flex-1 py-6">
        <dl className="space-y-3">
          <Stat label="Profile status" value={auraBand(score)} accent />
          <Stat label="Aura balance" value={score.toLocaleString()} />
          <Stat
            label="Deck progress"
            value={
              deckSize > 0 ? `${cardsSwiped}/${deckSize} SWIPED` : "NO DECK"
            }
          />
          <Stat label="Feed source" value={sourceLabel} />
          <Stat
            label="Engine"
            value={mode === null ? "CONNECTING" : (model ?? "MOCK ENGINE")}
          />
          <Stat
            label="Positions taken"
            value={`${tally.bullish} BULL // ${tally.bearish} BEAR`}
          />
        </dl>

        <div className="mt-6 flex min-h-0 flex-col">
          <p className="font-mono text-[9px] tracking-[0.24em] text-muted uppercase">
            Live trace
          </p>
          <div className="card-scroll mt-2 max-h-52 space-y-1 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="font-mono text-[10.5px] text-muted">
                [SYSTEM]: awaiting first event…
              </p>
            ) : (
              logs.map((line) => (
                <p
                  key={line.id}
                  className="font-mono text-[10.5px] leading-relaxed text-bull/80"
                >
                  <span className="text-bull">[{line.channel}]</span>:{" "}
                  {line.message}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-line pt-4">
        <p className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
          67 Labs deployment core
        </p>
        <p className="mt-1 font-mono text-[9px] tracking-[0.18em] text-muted/70 uppercase">
          {mode === "ai" ? "ENGINE ONLINE" : "FALLBACK MODE"} //{" "}
          {model ?? "no model"}
        </p>
      </footer>
    </aside>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
        {label}
      </dt>
      <dd
        className={`truncate font-mono text-[10.5px] tracking-wide uppercase ${
          accent ? "text-bull" : "text-paper/80"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
