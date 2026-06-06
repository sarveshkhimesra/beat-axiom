"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { COMPANIES } from "@/lib/content/companies";
import { CUSTOMERS } from "@/lib/content/customers";
import { GameState } from "@/lib/types";
import { AxiomAvatar } from "./AxiomAvatar";
import { Confetti } from "./Confetti";
import { speak, stopSpeaking, useTTSEnabled } from "@/lib/useSpeech";
import { playCelebration, playCheer } from "@/lib/sfx";

interface WinnerRevealProps {
  state: GameState;
}

export function WinnerReveal({ state }: WinnerRevealProps) {
  const finale = state.finale;
  const { enabled: ttsEnabled, setEnabled: setTtsEnabled } = useTTSEnabled(
    "thedeal:tts:projector",
    true,
  );
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!finale) return;
    const key = `${finale.finalizedAt}`;
    if (spokenRef.current === key) return;
    spokenRef.current = key;
    playCelebration();
    // A second, lighter cheer after the closing remarks land.
    const cheer = setTimeout(() => playCheer(), 9500);
    if (!ttsEnabled) return () => clearTimeout(cheer);
    const winner = state.teams[finale.winnerTeamId ?? ""];
    const winnerName = winner?.company ? COMPANIES[winner.company].name : winner?.playerName;
    const intro = winnerName
      ? `Four stages. One deal. The winner is ${winnerName}.`
      : "Four stages. One deal.";
    stopSpeaking();
    const t1 = setTimeout(() => speak(intro, { rate: 1.0, voice: "axiom" }), 2400);
    const t2 = setTimeout(() => speak(finale.winnerJourneyLine, { rate: 1.05, voice: "axiom" }), 5200);
    return () => { clearTimeout(cheer); clearTimeout(t1); clearTimeout(t2); };
  }, [finale, ttsEnabled, state.teams]);

  useEffect(() => {
    if (!ttsEnabled) stopSpeaking();
  }, [ttsEnabled]);

  if (!finale) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-10">
        <AxiomAvatar size={220} />
        <div className="font-mono-display muted-text text-lg mt-6 pulse-timer">
          AXIOM is preparing the closing remarks…
        </div>
      </main>
    );
  }
  const winnerId = finale.winnerTeamId;
  const winner = winnerId ? state.teams[winnerId] : null;
  const winnerCompany = winner?.company ? COMPANIES[winner.company] : null;
  const customer = state.customer ? CUSTOMERS[state.customer] : null;

  return (
    <main className="relative min-h-screen p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full" style={{ zIndex: 1 }}>
      <Confetti />
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4 justify-between"
      >
        <div className="flex items-center gap-4">
          <AxiomAvatar size={92} />
          <div>
            <div className="font-mono-display text-xs muted-text tracking-widest">// FINAL</div>
            <div className="font-mono-display text-4xl">
              THE DEAL — <span className="accent-text">{customer?.name ?? "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="btn text-xs"
            onClick={() => setTtsEnabled(!ttsEnabled)}
          >
            {ttsEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
          </button>
          <a
            className="btn text-xs"
            href="/summary"
            target="_blank"
            rel="noreferrer"
          >
            📄 SUMMARY
          </a>
        </div>
      </motion.header>

      {winner && (
        <motion.section
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.3 }}
          className="surface rounded-2xl p-8 border-2 text-center relative overflow-hidden"
          style={{ borderColor: "var(--accent-primary)", boxShadow: "0 0 80px rgba(0,245,160,0.25)" }}
        >
          {/* pulsing glow behind the champion */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{ width: 700, height: 700, marginLeft: -350, marginTop: -350, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,245,160,0.18) 0%, transparent 60%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="text-6xl relative"
            animate={{ rotate: [-8, 8, -8], y: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            🏆
          </motion.div>
          <div className="text-xs muted-text font-mono-display tracking-[0.5em] mt-2 relative">// CHAMPION</div>
          <motion.div
            className="font-mono-display text-6xl md:text-7xl accent-text relative mt-2"
            animate={{ textShadow: ["0 0 20px rgba(0,245,160,0.4)", "0 0 55px rgba(0,245,160,0.9)", "0 0 20px rgba(0,245,160,0.4)"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {winnerCompany?.name ?? winner.playerName}
          </motion.div>
          <div className="muted-text font-mono-display text-lg mt-2 relative">
            Team {winner.id} · cumulative {winner.currentScore}
          </div>
          <div className="text-base mt-4 italic muted-text max-w-3xl mx-auto relative">
            &ldquo;{finale.winnerJourneyLine}&rdquo;
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="surface rounded p-5"
      >
        <div className="text-xs muted-text font-mono-display tracking-widest mb-3">
          // IDEAL PLAY — WHAT GREAT WOULD HAVE LOOKED LIKE
        </div>
        <div className="space-y-3">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className="text-sm">
              <span className="font-mono-display accent-text mr-2">STAGE {s}:</span>
              <span className="muted-text">
                {finale.idealPlay[`stage${s}` as keyof typeof finale.idealPlay]}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="surface rounded p-5"
      >
        <div className="text-xs muted-text font-mono-display tracking-widest mb-3">
          // GROWTH OPPORTUNITIES
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(finale.growthOpportunities).map(([teamId, line]) => {
            const t = state.teams[teamId];
            if (!t) return null;
            return (
              <div key={teamId} className="surface rounded p-3">
                <div className="font-mono-display text-xs muted-text">
                  TEAM {teamId} · {t.playerName}
                </div>
                <div className="text-sm muted-text mt-1">{line}</div>
              </div>
            );
          })}
        </div>
      </motion.section>
    </main>
  );
}
