"use client";

import { useEffect, useRef, useState } from "react";
import { useGameState, useCountdown, fmtTime } from "@/lib/useGameState";
import { CUSTOMERS } from "@/lib/content/customers";
import { StageNumber } from "@/lib/types";
import { AxiomAvatar } from "./AxiomAvatar";
import { ScoreReveal } from "./ScoreReveal";
import { WinnerReveal } from "./WinnerReveal";
import { ProjectorConsole } from "./ProjectorConsole";
import { TipsTheater } from "./TipsTheater";
import { ScoringWait } from "./ScoringWait";
import { VideoStage } from "./VideoStage";
import { EliminationStage } from "./EliminationStage";
import { installAutoUnlock } from "@/lib/sfx";
import { installSpeechUnlock } from "@/lib/useSpeech";

export default function ProjectorPage() {
  // Projector polls fast (single device — negligible load) so video / score /
  // elimination switches feel instant even if the Pusher push is slow.
  const { state, loading } = useGameState(1200);
  const remaining = useCountdown(state);

  useEffect(() => {
    installAutoUnlock();
    installSpeechUnlock();
  }, []);

  // Full-screen elimination announcement: when the facilitator cuts a team,
  // `elimAnnounce.at` changes. Show the takeover once per new value for ~9s,
  // then revert to whatever screen was underneath. We capture the value present
  // at mount so a page reload doesn't replay the last cut.
  const [elimShow, setElimShow] = useState(false);
  const elimMountAt = useRef<number | null | undefined>(undefined);
  const elimShownAt = useRef<number | null>(null);
  const elimAt = state?.elimAnnounce?.at ?? null;
  useEffect(() => {
    if (elimMountAt.current === undefined) elimMountAt.current = elimAt; // capture once
    if (elimAt == null) return;
    if (elimAt === elimMountAt.current) return; // existed at mount → don't replay
    if (elimAt === elimShownAt.current) return; // already shown this one
    elimShownAt.current = elimAt;
    setElimShow(true);
    const t = setTimeout(() => setElimShow(false), 9000);
    return () => clearTimeout(t);
  }, [elimAt]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-mono-display muted-text">loading…</div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-10">
        <h1 className="font-mono-display accent-text text-5xl tracking-widest mb-4">THE DEAL</h1>
        <div className="muted-text font-mono-display">awaiting facilitator…</div>
      </main>
    );
  }

  // An elimination announcement takes over everything for its ~9s window.
  if (elimShow && state.elimAnnounce) {
    return <EliminationStage announce={state.elimAnnounce} state={state} />;
  }

  // A playing video takes over the whole projector, regardless of game status.
  if (state.nowPlayingVideo) {
    return <VideoStage video={state.nowPlayingVideo} />;
  }

  const customer = state.customer ? CUSTOMERS[state.customer] : null;
  const lowTime = remaining > 0 && remaining < 60;
  const isEvaluating = state.status === "stage-evaluating";
  const isReveal = state.status === "stage-reveal";
  const currentEval = state.stageEvaluations[state.stage as StageNumber];

  // LOBBY — big control terminal while the facilitator sets up.
  if (state.status === "lobby") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono p-8">
        <div className="text-[#00f5a0] text-5xl font-bold tracking-widest mb-1">THE DEAL</div>
        <div className="text-[#8888aa] text-sm mb-6">// SALES CHAMPIONSHIP</div>
        <div className="w-full max-w-4xl">
          <ProjectorConsole lines={state.console ?? []} big />
        </div>
        <div className="text-[#8888aa] text-xs mt-6 animate-pulse">
          {state.customer ? `${CUSTOMERS[state.customer].name} · standing by for the facilitator…` : "Waiting for game to start…"}
        </div>
        <div className="absolute bottom-4 right-4 text-[#2a2a3a] text-xs font-mono">
          GAME: {state.gameId}
        </div>
      </div>
    );
  }

  // BRIEF — pre-Stage-1 reading period. Clock not running; teams study briefs.
  // Without this branch the projector would fall through to the active-stage HUD
  // and show a frozen 00:00 timer (the F-08 bug class). F-12.
  if (state.status === "brief") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center font-mono">
        <div className="text-[#00f5a0] text-4xl font-bold tracking-widest mb-4">THE DEAL</div>
        <div className="text-[#8888aa] text-sm">// BRIEFING</div>
        <div className="text-[#e8e8f0] text-lg mt-8">Teams are studying their briefs.</div>
        <div className="text-[#8888aa] text-xs mt-2 animate-pulse">
          {customer ? `${customer.name} engagement · Stage 1 starts shortly…` : "Stage 1 starts shortly…"}
        </div>
        <div className="absolute bottom-4 right-4 text-[#2a2a3a] text-xs font-mono">
          GAME: {state.gameId}
        </div>
      </div>
    );
  }

  // EVALUATING screen — AXIOM talks (self-talk gyaan) + casino pulse while it scores.
  if (isEvaluating) {
    return <ScoringWait stage={state.stage} />;
  }

  // ENDED — winner reveal sequence.
  if (state.status === "ended") {
    return <WinnerReveal state={state} />;
  }

  // REVEAL — animated AXIOM-led scoreboard.
  if (isReveal && currentEval) {
    return <ScoreReveal state={state} evaluation={currentEval} />;
  }

  // Default: cinematic active-round screen — central AI face, clean info below.
  const roundName =
    ({ 1: "PAYMENT", 2: "PRODUCT", 3: "TECH", 4: "FINANCE", 5: "FINAL" } as Record<number, string>)[
      state.stage
    ] ?? "";
  const lastCmd = state.console && state.console.length ? state.console[state.console.length - 1] : null;
  return (
    <main className="h-screen overflow-hidden flex flex-col items-center px-8 py-6" style={{ background: "#06070d" }}>
      {/* Round label — sized for a projector across the room */}
      <div className="text-center mb-4">
        <div className="font-mono-display text-sm tracking-[0.45em]" style={{ color: "#5a6a88" }}>
          THE DEAL · {customer ? customer.name.toUpperCase() : ""}
        </div>
        <div className="font-mono-display text-3xl md:text-4xl tracking-widest mt-1" style={{ color: "#8fb0e0" }}>
          ROUND {state.stage} / 5 · {roundName} · {state.stagePhase === "pitch" ? "PITCH" : "QUESTIONS"}
        </div>
      </div>

      {/* Central AI face — the hero */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 w-full">
        <AxiomAvatar size={230} talking={false} />
        <div
          className={`font-mono-display text-5xl ${lowTime ? "pulse-timer" : ""}`}
          style={{ color: lowTime ? "#ff6b6b" : "#3da5ff" }}
        >
          {fmtTime(remaining)}
        </div>
        <TipsTheater state={state} />
      </div>

      {/* Live terminal — mirrors each facilitator button tap as a shell command */}
      <div
        className="w-full max-w-4xl mx-auto mt-4 font-mono-display text-sm rounded px-4 py-2 truncate"
        style={{ background: "#0a0f0a", border: "1px solid #15351f" }}
      >
        <span style={{ color: "#5a7" }}>deal@projector:~$</span>{" "}
        <span style={{ color: "#8be9b0" }}>{lastCmd ? lastCmd.cmd : "awaiting facilitator…"}</span>
        {lastCmd?.out && <span style={{ color: "#5a6a88" }}>{"  ↳ "}{lastCmd.out}</span>}
      </div>
    </main>
  );
}
