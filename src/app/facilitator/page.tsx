"use client";

import { useState } from "react";
import { COMPANY_LIST, COMPANIES } from "@/lib/content/companies";
import { useGameState, useCountdown, fmtTime } from "@/lib/useGameState";
import {
  CompanyId,
  CustomerId,
  TEAM_IDS,
  StageNumber,
  DEFAULT_BRIEF_DURATION_SEC,
  DEFAULT_QUESTION_DURATION_SEC,
  DEFAULT_PITCH_DURATION_SEC,
} from "@/lib/types";
import { STAGE_RUBRICS } from "@/lib/scoring";

type Assignment = {
  teamId: string;
  playerName: string;
  company: CompanyId | null;
};

export default function FacilitatorPage() {
  const { state, refresh } = useGameState();
  const remaining = useCountdown(state);

  const customer: CustomerId = "NOVABRAND";
  const [questionDurationSec, setQuestionDurationSec] = useState(DEFAULT_QUESTION_DURATION_SEC);
  const [pitchDurationSec, setPitchDurationSec] = useState(DEFAULT_PITCH_DURATION_SEC);
  const [briefDurationSec, setBriefDurationSec] = useState(DEFAULT_BRIEF_DURATION_SEC);
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    TEAM_IDS.map((id, i) => ({
      teamId: id,
      playerName: `Team ${id}`,
      company: COMPANY_LIST[i]?.id ?? null,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function initGame() {
    setBusy(true);
    setStatusMsg("initializing…");
    try {
      const r = await fetch("/api/game/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer, questionDurationSec, pitchDurationSec, briefDurationSec, teamAssignments: assignments }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`init failed: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function startStage(stage?: StageNumber) {
    setBusy(true);
    setStatusMsg(null);
    try {
      await fetch("/api/game/start-stage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(stage ? { stage } : {}),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }


  async function endStage() {
    setBusy(true);
    setStatusMsg("AXIOM is scoring… (this can take 10-30s)");
    try {
      const r = await fetch("/api/game/end-stage", { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`scoring failed: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function extendTime(seconds = 120) {
    setBusy(true);
    setStatusMsg(`+${Math.round(seconds / 60)}:00 added`);
    try {
      const r = await fetch("/api/game/extend-time", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seconds }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`extend failed: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function playVideo(video: "cinematic" | "demo" | null) {
    setBusy(true);
    setStatusMsg(video ? `projecting ${video}…` : "stopping video…");
    try {
      await fetch("/api/game/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ video }),
      });
      setStatusMsg(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setChat(on: boolean) {
    setBusy(true);
    try {
      await fetch("/api/game/input-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatEnabled: on }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const hasGame = !!state;
  const inStage = state?.status === "stage-active";
  const inQuestions = inStage && state?.stagePhase === "questions";
  const inPitch = inStage && state?.stagePhase === "pitch";
  const isEvaluating = state?.status === "stage-evaluating";
  const inReveal = state?.status === "stage-reveal";
  const inBrief = state?.status === "brief";
  // The brief is a pre-Stage-1 reading period — only offer it before play starts.
  const beforeStage1 = hasGame && state?.stage === 1 && !inStage && !isEvaluating && !inReveal;
  const currentEvaluation = state ? state.stageEvaluations[state.stage as StageNumber] : null;
  const nextStage =
    state && state.stage < 5
      ? ((state.stage + 1) as StageNumber)
      : null;

  async function postSimple(path: string, label: string) {
    setBusy(true);
    setStatusMsg(label);
    try {
      const r = await fetch(path, { method: "POST" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`${label}: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  // Free a team's single-device write lock so the captain can re-open on a new
  // device (e.g. their laptop died). Teammates can't take over on their own.
  async function resetLock(teamId: string) {
    setBusy(true);
    setStatusMsg("resetting device lock…");
    try {
      const r = await fetch("/api/game/release-writer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`reset failed: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  // Manual elimination — the facilitator cuts (or restores) a team at any stage.
  // reason "ai" announces it on the projector as an AXIOM integrity catch.
  async function eliminate(teamId: string, reason: "normal" | "ai" | "restore") {
    setBusy(true);
    setStatusMsg(reason === "restore" ? "restoring…" : reason === "ai" ? "flagging AI use…" : "eliminating…");
    try {
      const r = await fetch("/api/game/eliminate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId, reason }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setStatusMsg(`eliminate failed: ${j.error ?? r.statusText}`);
      } else {
        setStatusMsg(null);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-mono-display accent-text text-2xl">FACILITATOR // THE DEAL</h1>
        <div className="muted-text font-mono-display text-xs">
          {state ? `game ${state.gameId} · ${state.status}` : "no game"}
        </div>
      </header>

      <div className="mb-6 rounded p-3 font-mono-display text-xs" style={{ background: "#0a0f0a", border: "1px solid #1a2a1a", color: "#5a8a6e" }}>
        Tap the buttons below to drive the game — each action prints a live command on the projector terminal.
      </div>

      <section className="surface rounded p-5 mb-6">
        <h2 className="font-mono-display text-sm muted-text mb-4">// SETUP</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <div className="text-xs muted-text mb-1 font-mono-display">CUSTOMER</div>
            <div className="input font-mono-display" style={{ cursor: "default" }}>
              NovaBrand
            </div>
          </label>
          <label className="block">
            <div className="text-xs muted-text mb-1 font-mono-display">QUESTIONS (sec)</div>
            <input type="number" className="input" value={questionDurationSec} onChange={(e) => setQuestionDurationSec(Number(e.target.value))} min={30} max={900} />
          </label>
          <label className="block">
            <div className="text-xs muted-text mb-1 font-mono-display">PITCH (sec)</div>
            <input type="number" className="input" value={pitchDurationSec} onChange={(e) => setPitchDurationSec(Number(e.target.value))} min={30} max={900} />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <div className="text-xs muted-text mb-1 font-mono-display">BRIEF DURATION (sec)</div>
            <input type="number" className="input" value={briefDurationSec} onChange={(e) => setBriefDurationSec(Number(e.target.value))} min={60} max={900} />
          </label>
        </div>

        <div className="space-y-2">
          {assignments.map((a, i) => (
            <div key={a.teamId} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2 font-mono-display muted-text">TEAM {a.teamId}</div>
              <input
                className="input col-span-5"
                value={a.playerName}
                placeholder="Player name"
                onChange={(e) => {
                  const next = [...assignments];
                  next[i] = { ...a, playerName: e.target.value };
                  setAssignments(next);
                }}
              />
              <select
                className="input col-span-5"
                value={a.company ?? ""}
                onChange={(e) => {
                  const next = [...assignments];
                  next[i] = { ...a, company: (e.target.value || null) as CompanyId | null };
                  setAssignments(next);
                }}
              >
                <option value="">— pick company —</option>
                {COMPANY_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.tagline}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button className="btn btn-primary" onClick={initGame} disabled={busy}>
            {hasGame ? "Reset Game" : "Initialize Game"}
          </button>
        </div>

        {/* Shareable team links — by company name (resolves to the right team) */}
        <div className="mt-5">
          <div className="font-mono-display text-xs muted-text mb-2">// TEAM LINKS — give CAPTAIN the captain link, everyone else the watch link</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {assignments.map((a) => {
              const slug = a.company ? a.company.toLowerCase() : a.teamId;
              const name = a.company ? COMPANIES[a.company].name : `Team ${a.teamId}`;
              const tok = state?.teams[a.teamId]?.writeToken;
              const wtok = state?.teams[a.teamId]?.watchToken;
              const captainLink = tok ? `/team/${slug}?k=${tok}` : `/team/${slug}`;
              const watchLink = wtok ? `/team/${slug}/watch?w=${wtok}` : `/team/${slug}/watch`;
              const locked = !!state?.teams[a.teamId]?.writerClientId;
              return (
                <div key={a.teamId} className="font-mono-display text-xs flex items-center gap-2 flex-wrap">
                  <span className="muted-text" style={{ minWidth: 96 }}>{name}</span>
                  <span style={{ color: "#5a8a6e" }}>captain:</span>
                  <code style={{ color: "#8be9b0" }}>{captainLink}</code>
                  <span className="muted-text">· watch:</span>
                  <code style={{ color: "#7db4ff" }}>{watchLink}</code>
                  <span style={{ color: locked ? "#ffaa00" : "#5a6a88" }}>{locked ? "🔒 device locked" : "○ free"}</span>
                  {locked && (
                    <button
                      className="btn text-xs"
                      disabled={busy}
                      onClick={() => { if (confirm(`Reset ${name}'s device lock? Their current device loses write; the next device to open the captain link claims it.`)) resetLock(a.teamId); }}
                      title="Free the write seat (captain laptop died / wrong device)"
                    >
                      🔓 reset
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="muted-text text-xs mt-1">
            The <span style={{ color: "#8be9b0" }}>captain link</span> (with <code>?k=…</code>) is the only one that can send/submit — keep it to the captain. Everyone else gets <span style={{ color: "#7db4ff" }}>watch</span>.
          </div>
        </div>
      </section>

      <section className="surface rounded p-5 mb-6">
        <h2 className="font-mono-display text-sm muted-text mb-4">// VIDEOS (play full-screen on the projector)</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            className={`btn ${state?.nowPlayingVideo === "cinematic" ? "btn-primary" : ""}`}
            disabled={!hasGame || busy}
            onClick={() => playVideo("cinematic")}
          >
            🎬 Play Cinematic
          </button>
          <button
            className={`btn ${state?.nowPlayingVideo === "demo" ? "btn-primary" : ""}`}
            disabled={!hasGame || busy}
            onClick={() => playVideo("demo")}
            title="Demo embed URL not set yet — add it in src/lib/content/videos.ts"
          >
            ▶ Play Demo
          </button>
          {state?.nowPlayingVideo && (
            <button className="btn btn-danger" disabled={busy} onClick={() => playVideo(null)}>
              ■ Stop video
            </button>
          )}
          <span className="font-mono-display text-xs muted-text ml-2">
            {state?.nowPlayingVideo ? `playing: ${state.nowPlayingVideo}` : "the projector shows the video until you stop it"}
          </span>
        </div>
      </section>

      <section className="surface rounded p-5 mb-6">
        <h2 className="font-mono-display text-sm muted-text mb-4">// BRIEFING</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            className="btn"
            disabled={!beforeStage1 || busy || !state?.customer || inBrief}
            onClick={() => postSimple("/api/game/start-brief", "showing brief…")}
            title="Put teams on a no-clock reading screen with their brief before Stage 1"
          >
            📋 Show Brief to Teams
          </button>
          {inBrief && (
            <span className="muted-text font-mono-display text-xs">
              Teams are reading. Clock is not running — click “Start Stage 1” when ready.
            </span>
          )}
        </div>
      </section>

      <section className="surface rounded p-5">
        <h2 className="font-mono-display text-sm muted-text mb-4">// CONTROLS</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono-display text-3xl">
              {state ? `STAGE ${state.stage}` : "—"}
              {inStage && (
                <span className="text-lg ml-3" style={{ color: inQuestions ? "#00f5a0" : "#ffaa00" }}>
                  {inPitch ? "· PITCH" : "· QUESTIONS"}
                </span>
              )}
            </div>
            <div className="muted-text text-xs font-mono-display">{state?.status ?? "no state"}</div>
            {statusMsg && <div className="text-xs accent-text mt-1 font-mono-display">{statusMsg}</div>}
          </div>
          <div className={`font-mono-display text-5xl ${remaining > 0 && remaining < 60 ? "pulse-timer" : "accent-text"}`}>
            {fmtTime(remaining)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5] as StageNumber[]).map((s) => (
            <button
              key={s}
              className="btn"
              disabled={!hasGame || busy || (inStage && state.stage === s)}
              onClick={() => startStage(s)}
            >
              {s === 5 ? "Start Round 5 (Pitch)" : `Start Round ${s}`}
            </button>
          ))}
          <button className="btn" disabled={!inStage || busy} onClick={() => extendTime(120)} title="Add 2 minutes of overtime to the live round">
            + 2:00
          </button>
          <button className="btn btn-danger" disabled={!inStage || busy} onClick={endStage}>
            {isEvaluating ? "Evaluating…" : "End Round"}
          </button>
          {inReveal && nextStage && (
            <button className="btn btn-primary" disabled={busy} onClick={() => startStage(nextStage)}>
              Advance → Round {nextStage}
            </button>
          )}
        </div>
        {/* Team input mode — flip on chat/typing if voice misbehaves on the day */}
        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono-display text-xs muted-text">TEAM INPUT:</span>
          <button
            className="btn text-xs"
            disabled={!hasGame || busy}
            onClick={() => setChat(!state?.chatEnabled)}
            title="Toggle whether teams can type as well as speak"
          >
            {state?.chatEnabled ? "🎤 + ⌨️  Voice + Chat (tap for voice-only)" : "🎤 Voice only (tap to allow chat)"}
          </button>
        </div>
        {inQuestions && (
          <div className="text-xs muted-text mt-2 font-mono-display">
            Conversation round — teams are asking questions. Click “End Round” when the 5-minute timer runs out (AXIOM scores the conversation and eliminates the lowest).
          </div>
        )}
        {inPitch && (
          <div className="text-xs muted-text mt-2 font-mono-display">
            Final round — teams are writing their pitch (with their prep brief). Click “End Round” when the timer runs out.
          </div>
        )}
        {inReveal && state?.stage === 4 && (
          <div className="text-xs accent-text mt-2 font-mono-display">
            Prep briefs generated for the finalists. Click “Advance → Round 5” for the final pitch.
          </div>
        )}
      </section>

      {currentEvaluation && (
        <section className="surface rounded p-5 mt-6">
          <h2 className="font-mono-display text-sm muted-text mb-4">
            // STAGE {state!.stage} REVEAL — AXIOM&apos;S TAKE
          </h2>
          {currentEvaluation.tiebreakRequired && (
            <TiebreakControl
              evaluation={currentEvaluation}
              teams={state!.teams}
              busy={busy}
              onResolve={async (teamId) => {
                setBusy(true);
                setStatusMsg("resolving tiebreak…");
                try {
                  const r = await fetch("/api/game/resolve-tiebreak", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ teamId }),
                  });
                  if (!r.ok) {
                    const j = await r.json().catch(() => ({}));
                    setStatusMsg(`tiebreak failed: ${j.error ?? r.statusText}`);
                  } else {
                    setStatusMsg(null);
                  }
                  await refresh();
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(currentEvaluation.scores)
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((s) => {
                const team = state!.teams[s.teamId];
                const isEliminated = currentEvaluation.eliminatedTeamId === s.teamId;
                return (
                  <div
                    key={s.teamId}
                    className={`surface rounded p-4 ${isEliminated ? "border-2" : ""}`}
                    style={isEliminated ? { borderColor: "var(--accent-danger)" } : undefined}
                  >
                    <div className="flex justify-between items-baseline">
                      <div>
                        <div className="font-mono-display text-xs muted-text">TEAM {s.teamId}</div>
                        <div className="font-mono-display text-lg">{team.playerName}</div>
                        <div className="text-xs muted-text">{team.company ? COMPANIES[team.company].name : "—"}</div>
                      </div>
                      <div className={`font-mono-display text-3xl ${isEliminated ? "danger-text" : "accent-text"}`}>
                        {s.totalScore}
                        {isEliminated && <span className="text-xs ml-1">ELIM</span>}
                      </div>
                    </div>
                    <div className="text-xs muted-text mt-2 italic">&ldquo;{s.quirkySummary}&rdquo;</div>
                    {s.bestQuestion && (
                      <div className="text-xs mt-2">
                        <span className="accent-text font-mono-display">BEST:</span>{" "}
                        <span className="muted-text">{s.bestQuestion}</span>
                      </div>
                    )}
                    {s.worstQuestion && (
                      <div className="text-xs mt-1">
                        <span className="danger-text font-mono-display">WORST:</span>{" "}
                        <span className="muted-text">{s.worstQuestion}</span>
                      </div>
                    )}
                    {s.secretPriorityRevealed && (
                      <div className="text-xs mt-2 accent-text font-mono-display">★ SECRET PRIORITY: REVEALED</div>
                    )}
                    <details className="mt-3">
                      <summary className="text-xs muted-text font-mono-display cursor-pointer">// breakdown</summary>
                      <div className="text-xs mt-2 space-y-0.5">
                        {STAGE_RUBRICS[s.stage].dimensions.map((d) => (
                          <div key={d.key} className="flex justify-between">
                            <span className="muted-text">{d.label}</span>
                            <span className="font-mono-display">
                              {s.dimensions[d.key] ?? 0} / {d.points}
                            </span>
                          </div>
                        ))}
                        {s.penalties !== 0 && (
                          <div className="flex justify-between danger-text">
                            <span>penalties</span>
                            <span className="font-mono-display">{s.penalties}</span>
                          </div>
                        )}
                        {s.responsivenessBonus > 0 && (
                          <div className="flex justify-between accent-text">
                            <span>responsiveness bonus</span>
                            <span className="font-mono-display">+{s.responsivenessBonus}</span>
                          </div>
                        )}
                        {s.crossStageBonus > 0 && (
                          <div className="flex justify-between accent-text">
                            <span>cross-stage bonus</span>
                            <span className="font-mono-display">+{s.crossStageBonus}</span>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {state && state.status !== "lobby" && state.status !== "ended" && (
        <section className="surface rounded p-5 mt-6" style={{ borderLeft: "4px solid var(--accent-danger)" }}>
          <h2 className="font-mono-display text-sm muted-text mb-1">// ELIMINATION CONTROL — you decide</h2>
          <div className="text-xs muted-text mb-4 font-mono-display leading-relaxed">
            AXIOM only <span className="accent-text">scores</span> — it never auto-cuts. Eliminate 0 or any number, any round.
            Walk the tables; if a team is using AI, hit <span className="danger-text">⚠ AI&nbsp;DETECTED</span> — the projector
            announces it as AXIOM catching them. Mistake? <span className="accent-text">Restore</span> puts them back.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {state.teamOrder.map((id) => {
              const t = state.teams[id];
              const co = t.company ? COMPANIES[t.company].name : t.playerName;
              return (
                <div
                  key={id}
                  className={`surface rounded p-3 ${t.eliminated ? "opacity-60" : ""}`}
                  style={t.eliminated ? { borderColor: "var(--accent-danger)", borderWidth: 1 } : undefined}
                >
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="font-mono-display text-xs muted-text">TEAM {id}</div>
                      <div className="font-mono-display text-base">{co}</div>
                    </div>
                    <div className="font-mono-display text-2xl accent-text">{t.currentScore ?? 0}</div>
                  </div>
                  {t.eliminated ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs danger-text font-mono-display">
                        {t.eliminatedReason === "ai" ? "⚠ AI-FLAGGED" : "✗ ELIMINATED"} @ R{t.eliminatedAtStage}
                      </span>
                      <button className="btn text-xs" disabled={busy} onClick={() => eliminate(id, "restore")}>
                        ↺ Restore
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="btn btn-danger text-xs flex-1"
                        disabled={busy}
                        onClick={() => { if (confirm(`Eliminate ${co}? (normal)`)) eliminate(id, "normal"); }}
                        title="Normal elimination — didn't make the cut"
                      >
                        ✗ Eliminate
                      </button>
                      <button
                        className="btn text-xs flex-1"
                        disabled={busy}
                        style={{ borderColor: "#ffb454", color: "#ffb454" }}
                        onClick={() => { if (confirm(`Eliminate ${co} for AI use? Projector will announce it as an AXIOM integrity catch.`)) eliminate(id, "ai"); }}
                        title="Eliminate for AI-assisted play — shown as AXIOM detecting AI"
                      >
                        ⚠ AI detected
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {inReveal && state.stage === 5 && (
            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs muted-text mb-2 font-mono-display">
                Final round scored. Do any last cuts above, then crown the winner (highest cumulative survivor).
              </div>
              <button
                className="btn btn-primary w-full"
                disabled={busy}
                onClick={() => { if (confirm("Declare the winner now? This ends the game and runs the finale.")) postSimple("/api/finalize", "declaring winner…"); }}
              >
                🏆 Declare Winner → end game
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function TiebreakControl({
  evaluation,
  teams,
  busy,
  onResolve,
}: {
  evaluation: import("@/lib/types").StageEvaluation;
  teams: Record<string, import("@/lib/types").TeamState>;
  busy: boolean;
  onResolve: (teamId: string) => Promise<void>;
}) {
  const scoreValues = Object.values(evaluation.scores).filter((s) => !teams[s.teamId]?.eliminated);
  const sorted = [...scoreValues].sort((a, b) => a.totalScore - b.totalScore);
  if (sorted.length === 0) return null;
  const lowest = sorted[0].totalScore;
  const tied = sorted.filter((s) => s.totalScore === lowest);
  return (
    <div
      className="surface rounded p-4 mb-4"
      style={{ borderLeft: "4px solid var(--accent-warn)" }}
    >
      <div className="font-mono-display accent-text mb-1">⚠ TIEBREAK</div>
      <div className="muted-text text-sm mb-3">
        {tied.length} teams tied at {lowest} pts. Pick who&apos;s out:
      </div>
      <div className="flex flex-wrap gap-2">
        {tied.map((s) => {
          const t = teams[s.teamId];
          return (
            <button
              key={s.teamId}
              className="btn btn-danger"
              disabled={busy}
              onClick={() => onResolve(s.teamId)}
            >
              Eliminate Team {s.teamId} ({t?.playerName ?? "—"})
            </button>
          );
        })}
      </div>
    </div>
  );
}
