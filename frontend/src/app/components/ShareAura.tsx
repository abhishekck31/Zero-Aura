"use client";

import { Megaphone } from "lucide-react";

const REPO_URL = "https://github.com/abhishekck31/Zero-Aura";

function composePost(score: number): string {
  return [
    `My portfolio just printed high aura. Currently sitting at ${score.toLocaleString()} Aura on Zero-Aura ⚡`,
    "The Tinder for investing built for 67 Labs @opentradelive.",
    "Retweets keep me bullish.",
    `Build yours here: ${REPO_URL}`,
  ].join(" ");
}

interface ShareAuraProps {
  score: number;
}

export default function ShareAura({ score }: ShareAuraProps) {
  function share() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(
      composePost(score),
    )}`;
    // noopener/noreferrer so the composer cannot reach back through
    // window.opener.
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex items-center gap-1.5 rounded-lg border border-line bg-surface/80 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-muted uppercase transition hover:border-paper/40 hover:text-paper"
    >
      <Megaphone className="size-3" strokeWidth={2.5} />
      Brag on X
    </button>
  );
}
