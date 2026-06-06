"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANIES } from "@/lib/content/companies";
import { GameState, StageEvaluation } from "@/lib/types";
import { AxiomAvatar } from "./AxiomAvatar";
import { speak, stopSpeaking, useTTSEnabled } from "@/lib/useSpeech";
import { playStageRevealStart, playCardLand, playBuzzer } from "@/lib/sfx";

const REVEAL_INTERVAL_MS = 5000; // 5s between teams — time to read the summary + hear AXIOM's quip
const COUNT_UP_DURATION = 1.6;

// Verdicts whose animated reveal has already played this projector session. When
// an elimination overlay (or video) unmounts ScoreReveal and it later remounts,
// we show the STATIC full scoreboard — no replayed intro, no voiceover, no
// one-by-one reveal. Keyed by evaluatedAt (unique per round); reset on reload.
const revealedEvaluations = new Set<number>();

function ScoreCounter({ to, eliminated }: { to: number; eliminated: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(count, to, { duration: COUNT_UP_DURATION, ease: "easeOut" });
    return controls.stop;
  }, [count, to]);
  return (
    <motion.span
      className={`font-mono-display ${eliminated ? "danger-text" : "accent-text"}`}
      style={{ fontSize: 52 }}
    >
      {rounded}
    </motion.span>
  );
}

interface ScoreRevealProps {
  state: GameState;
  evaluation: StageEvaluation;
}

export function ScoreReveal({ state, evaluation }: ScoreRevealProps) {
  const { enabled: ttsEnabled, setEnabled: setTtsEnabled } = useTTSEnabled(
    "thedeal:tts:projector",
    true,
  );
  // Sort ascending (lowest first) so the most dramatic reveal comes last.
  // Memoized on the STABLE evaluatedAt timestamp (not evaluation.scores, whose
  // object reference changes on every poll) so the reveal timer isn't reset and
  // restarted each refresh — that would clear the 3.8s card timer before it ever
  // fires and freeze the board on empty skeletons.
  const orderedForReveal = useMemo(
    () => Object.values(evaluation.scores).sort((a, b) => a.totalScore - b.totalScore),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [evaluation.evaluatedAt],
  );
  const playedOnce = revealedEvaluations.has(evaluation.evaluatedAt);
  const [revealedCount, setRevealedCount] = useState(playedOnce ? orderedForReveal.length : 0);
  const [phase, setPhase] = useState<"axiom-intro" | "cards" | "verdict">(playedOnce ? "verdict" : "axiom-intro");
  const listRef = useRef<HTMLElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Already played this round once (e.g., returning from the elimination
    // overlay)? Show the static full scoreboard — no replay, no voiceover, no
    // one-by-one reveal.
    if (revealedEvaluations.has(evaluation.evaluatedAt)) {
      stopSpeaking();
      setRevealedCount(orderedForReveal.length);
      setPhase("verdict");
      return;
    }
    // First time for this round → mark it now (so any later remount is static)
    // and play the animated, narrated reveal.
    revealedEvaluations.add(evaluation.evaluatedAt);
    setRevealedCount(0);
    setPhase("axiom-intro");
    stopSpeaking();
    playStageRevealStart();
    if (ttsEnabled) {
      // Slight delay so the gong doesn't fight the voice.
      setTimeout(() => speak(`Stage ${evaluation.stage} verdict.`, { rate: 1.0, voice: "axiom" }), 600);
    }
    const introTimer = setTimeout(() => setPhase("cards"), 2200);
    return () => clearTimeout(introTimer);
    // ttsEnabled intentionally omitted so toggling voice mid-reveal doesn't
    // restart/abort the sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation.evaluatedAt, evaluation.stage]);

  useEffect(() => {
    if (phase !== "cards") return;
    if (revealedCount >= orderedForReveal.length) {
      const t = setTimeout(() => setPhase("verdict"), 1200);
      return () => clearTimeout(t);
    }
    // The card at this index is now on screen: ping + AXIOM speaks ITS quirky
    // one-liner (the 2-line summary is read silently on screen). 5s between teams.
    const card = orderedForReveal[revealedCount];
    playCardLand();
    if (ttsEnabled && card?.quirkyQuote) {
      speak(card.quirkyQuote, { rate: 1.0, voice: "axiom" });
    }
    const t = setTimeout(() => setRevealedCount((c) => c + 1), REVEAL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [phase, revealedCount, orderedForReveal, ttsEnabled]);

  // Stop any in-flight speech when toggling off.
  useEffect(() => {
    if (!ttsEnabled) stopSpeaking();
  }, [ttsEnabled]);

  // Keep the just-revealed card in view as the list grows. Scroll on the NEXT
  // frame so the new card (with its summary + quote) has laid out first — reading
  // scrollHeight synchronously here would use a stale, too-short height.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [revealedCount]);

  const eliminatedId = evaluation.eliminatedTeamId;
  const eliminatedScore = eliminatedId ? evaluation.scores[eliminatedId] : null;
  const eliminatedTeam = eliminatedId ? state.teams[eliminatedId] : null;

  // The elimination moment: fire the buzzer + a terse callout. No long brief.
  const elimAnnouncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase !== "verdict" || !eliminatedScore || !eliminatedTeam) return;
    const key = `${evaluation.evaluatedAt}-${eliminatedScore.teamId}`;
    if (elimAnnouncedRef.current === key) return;
    elimAnnouncedRef.current = key;
    const elimName = eliminatedTeam.company ? COMPANIES[eliminatedTeam.company].name : eliminatedTeam.playerName;
    const worst = eliminatedScore.worstQuestion;
    playBuzzer();
    if (ttsEnabled) {
      // Max ~2 lines: a nod, the miss, and their weakest moment.
      const brief = `${elimName}, you played well — but you missed the chance to land it.${worst ? ` Your weakest moment: ${worst}.` : ""} ${elimName} is eliminated.`;
      window.setTimeout(() => speak(brief, { rate: 1.0, voice: "axiom" }), 800);
    }
  }, [phase, eliminatedScore, eliminatedTeam, ttsEnabled, evaluation.evaluatedAt]);

  // The scoreboard + verdict STAY on screen after the reveal — no auto-advance.
  // The facilitator manually starts the next round when ready (gives everyone
  // time to read the feedback).

  if (phase === "axiom-intro") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AxiomAvatar size={200} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-mono-display text-2xl mt-6 tracking-widest accent-text"
        >
          STAGE {evaluation.stage} — VERDICT
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden p-6 flex flex-col">
      <header className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <AxiomAvatar size={72} />
          <div>
            <div className="font-mono-display text-xs muted-text tracking-widest">// AXIOM RULES</div>
            <div className="font-mono-display text-3xl mt-1">
              STAGE <span className="accent-text">{evaluation.stage}</span> — VERDICT
            </div>
            {evaluation.tiebreakRequired && (
              <div className="muted-text font-mono-display text-sm mt-1">
                <span className="accent-text">⚠ TIEBREAK</span> — facilitator decides the floor
              </div>
            )}
          </div>
        </div>
        <button
          className="btn text-xs"
          onClick={() => setTtsEnabled(!ttsEnabled)}
          title="Toggle AXIOM voice"
        >
          {ttsEnabled ? "🔊 VOICE ON" : "🔇 VOICE OFF"}
        </button>
      </header>

      <section ref={listRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 max-w-5xl mx-auto w-full">
        {orderedForReveal.map((s, idx) => {
          const visible = idx <= revealedCount;
          const team = state.teams[s.teamId];
          const isEliminated = eliminatedId === s.teamId;
          if (!visible) return <CardSkeleton key={s.teamId} />;
          return (
            <motion.div
              key={s.teamId}
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="surface rounded p-3 flex items-center gap-4"
              style={{
                borderColor: isEliminated ? "var(--accent-danger)" : "var(--border)",
                borderWidth: isEliminated ? 2 : 1,
                background: isEliminated
                  ? "linear-gradient(90deg, rgba(255,61,61,0.07), var(--bg-surface) 40%)"
                  : undefined,
              }}
            >
              <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[140px]">
                <ScoreCounter to={s.totalScore} eliminated={isEliminated} />
                {isEliminated && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: COUNT_UP_DURATION + 0.1 }}
                    className="text-xs danger-text font-mono-display tracking-widest"
                  >
                    ✗ ELIMINATED
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-mono-display text-xs muted-text">TEAM {s.teamId}</div>
                <div className="font-mono-display text-2xl">
                  {team?.company ? COMPANIES[team.company].name : (team?.playerName ?? "—")}
                </div>
                {/* 2-line summary (display only) */}
                {s.quirkySummary && (
                  <div className="text-sm muted-text mt-2 max-w-[70ch]">{s.quirkySummary}</div>
                )}
                {/* AXIOM's quirky one-liner — highlighted, and the line AXIOM speaks */}
                {s.quirkyQuote && (
                  <div
                    className="text-sm mt-1.5 font-mono-display max-w-[70ch]"
                    style={{ color: "#ffd166", fontStyle: "italic" }}
                  >
                    &ldquo;{s.quirkyQuote}&rdquo;
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {/* Bottom sentinel the auto-scroll targets so the newest card stays in view. */}
        <div ref={endRef} />
      </section>

      {phase === "verdict" && eliminatedScore && eliminatedTeam && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-4 flex-shrink-0 surface rounded p-4 text-center"
          style={{ borderColor: "var(--accent-danger)", borderWidth: 2 }}
        >
          <div className="font-mono-display tracking-widest danger-text text-2xl">
            ELIMINATED: {eliminatedTeam.company ? COMPANIES[eliminatedTeam.company].name : eliminatedTeam.playerName}
          </div>
        </motion.footer>
      )}
    </main>
  );
}

function CardSkeleton() {
  return (
    <div
      className="surface rounded p-3 flex items-center gap-4 opacity-30"
      style={{ minHeight: 84 }}
    >
      <div className="flex-shrink-0 min-w-[120px]" />
      <div className="flex-1" />
    </div>
  );
}
