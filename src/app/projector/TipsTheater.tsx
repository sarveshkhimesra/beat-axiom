"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameState, StageNumber } from "@/lib/types";
import { COMPANIES } from "@/lib/content/companies";
import { ROUND_TIPS } from "@/lib/content/tips";
import { secretForRound } from "@/lib/content/secrets";
import { AXIOM_INTERLUDES } from "@/lib/content/interludes";

interface FeedItem {
  tag: string;
  text: string;
}

// LIVE feed under the central AI face during a round: sales playbook + AXIOM
// lore + famous-pitch quotes cycle continuously, keeping the screen alive — and
// at RANDOM moments this round's SECRET decrypts onto the screen with a sting.
// A sharp team watching the projector catches it and feeds their team the move.
export function TipsTheater({ state }: { state: GameState }) {
  const stage = state.stage as StageNumber;
  const secret = secretForRound(stage); // the secret in play for THIS round (none in round 1)

  const pool = useMemo<FeedItem[]>(() => {
    const tips = (ROUND_TIPS[stage]?.normal ?? []).map((t) => ({ tag: "PLAYBOOK", text: t }));
    const lore = AXIOM_INTERLUDES.map((i) => ({ tag: i.tag, text: i.by ? `“${i.text}” — ${i.by}` : i.text }));
    // Interleave playbook tips with lore so it never feels repetitive.
    const out: FeedItem[] = [];
    const max = Math.max(tips.length, lore.length);
    for (let i = 0; i < max; i++) {
      if (tips[i]) out.push(tips[i]);
      if (lore[i]) out.push(lore[i]);
    }
    return out;
  }, [stage]);

  // Start each round at a different point in the bank so rounds don't all open
  // on the same quotes (the feed still cycles sequentially from there).
  const [idx, setIdx] = useState(() => (stage - 1) * 17);
  const [secretOn, setSecretOn] = useState(false);

  // Cycle the feed — one insight every 10s so it's readable, not frantic.
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), 10000);
    return () => clearInterval(id);
  }, []);

  // Drop the secret at random moments through the round (and re-drop later), so
  // it rewards teams who keep an eye on the screen.
  useEffect(() => {
    setSecretOn(false);
    if (!secret) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleShow = (delay: number) => {
      const t1 = setTimeout(() => {
        if (cancelled) return;
        setSecretOn(true);
        const t2 = setTimeout(() => {
          if (cancelled) return;
          setSecretOn(false);
          scheduleShow(35000 + Math.random() * 40000); // reappear randomly later
        }, 13000);
        timers.push(t2);
      }, delay);
      timers.push(t1);
    };
    scheduleShow(12000 + Math.random() * 20000); // first drop 12-32s into the round
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [secret, stage]);

  const item = pool.length ? pool[idx % pool.length] : null;
  const activeTeams = state.teamOrder.map((id) => state.teams[id]).filter((t) => !!t.company);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-5">
      {/* The living slot — either a cycling tip, or a sudden secret decrypt */}
      <div className="flex w-full items-center justify-center" style={{ minHeight: 110 }}>
        <AnimatePresence mode="wait">
          {secretOn && secret ? (
            // Looks like any other line in the stream — the ONLY tell is the
            // colour. Teams have to notice it and work out it's the real edge.
            <motion.div
              key="secret"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.95, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="font-mono-display text-[10px] tracking-[0.4em] mb-1" style={{ color: secret.color }}>
                {secret.badge.replace(/^SECRET\s*\/\/\s*/i, "")}
              </div>
              <div className="font-mono-display text-base leading-relaxed" style={{ color: secret.color }}>
                {secret.headline}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`tip-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.92, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="font-mono-display text-[10px] tracking-[0.4em] mb-1" style={{ color: "#4a86e8" }}>
                {item?.tag ?? "THE DEAL"}
              </div>
              <div className="font-mono-display text-base" style={{ color: "#9fb0cc" }}>
                {item?.text ?? "Stay sharp."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightweight team strip */}
      <div className="flex flex-wrap gap-2 justify-center">
        {activeTeams.map((t) => {
          const asked = t.conversationHistory.filter((m) => m.stage === stage && m.role === "team").length;
          const submitted = !!t.stageSubmissions?.[stage];
          return (
            <div
              key={t.id}
              className="font-mono-display text-xs rounded px-3 py-1.5 flex items-center gap-2"
              style={{
                background: "#101018",
                border: `1px solid ${t.eliminated ? "#3a2020" : "#23232f"}`,
                opacity: t.eliminated ? 0.4 : 1,
              }}
            >
              <span style={{ color: t.company ? "#cfd6e6" : "#8888aa" }}>
                {t.company ? COMPANIES[t.company].name : t.playerName}
              </span>
              {t.eliminated ? (
                <span style={{ color: "#ff6b6b" }}>out</span>
              ) : stage === 5 ? (
                <span style={{ color: submitted ? "#3da5ff" : "#ffaa00" }}>{submitted ? "pitch in ✓" : "writing…"}</span>
              ) : (
                <span style={{ color: "#3da5ff" }}>{"●".repeat(Math.min(asked, 5)) || "·"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
