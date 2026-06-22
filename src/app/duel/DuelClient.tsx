"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SCENARIOS, SCENARIO_IDS } from "@/lib/duel/scenarios";
import { MAX_PLAYER_TURNS, DUEL_DURATION_SECONDS, DUEL_WARNING_SECONDS, VAGUE_QUESTION_LIMIT } from "@/lib/duel/config";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import AxiomAvatar from "@/components/AxiomAvatar";

type Phase = "pick" | "play" | "scoring";

function hookFor(left: number): string {
  if (left <= 0) return "[axiom] out of questions — time to face the verdict.";
  const lines = [
    `[axiom] good going — ${left} to go.`,
    `[axiom] nice probe. ${left} left — keep digging.`,
    `[axiom] you're onto something. ${left} to go.`,
    `[axiom] sharp. ${left} left to close the deal.`,
  ];
  return lines[(MAX_PLAYER_TURNS - left) % lines.length];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DuelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const endRef = useRef<HTMLDivElement>(null);

  const preselected = searchParams.get("scenario") as ScenarioId | null;
  const [phase, setPhase] = useState<Phase>(preselected && SCENARIOS[preselected] ? "play" : "pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(preselected && SCENARIOS[preselected] ? preselected : null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);

  // Timer state
  const [startedAt, setStartedAt] = useState<number | null>(preselected && SCENARIOS[preselected] ? Date.now() : null);
  const [remaining, setRemaining] = useState(DUEL_DURATION_SECONDS);
  const [warned, setWarned] = useState(false);

  // Vague question tracking
  const [vagueStreak, setVagueStreak] = useState(0);

  useEffect(() => { setMutedState(isMuted()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, hook]);

  // Timer tick
  useEffect(() => {
    if (phase !== "play" || !startedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, DUEL_DURATION_SECONDS - elapsed);
      setRemaining(left);
      if (left <= DUEL_WARNING_SECONDS && !warned) {
        setWarned(true);
        setHook("[axiom] 30 seconds — wrap it up or I'm calling it.");
      }
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startedAt, warned]);

  const turnsUsed = history.filter((m) => m.role === "player").length;
  const scenario = scenarioId ? SCENARIOS[scenarioId] : null;
  const timeUp = remaining <= 0;

  const getVerdict = useCallback(async () => {
    if (!scenarioId || busy) return;
    setBusy(true); setError(null); setPhase("scoring");
    try {
      const res = await fetch("/api/duel/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      router.push(`/r/${data.session.shareId}`);
    } catch (e) { setError((e as Error).message); setPhase("play"); }
    finally { setBusy(false); }
  }, [scenarioId, busy, history, router]);

  // Auto-trigger verdict when time runs out
  useEffect(() => {
    if (timeUp && phase === "play" && history.length > 0 && !busy) {
      getVerdict();
    }
  }, [timeUp, phase, history.length, busy, getVerdict]);

  function toggleMute() { const n = !muted; setMuted(n); setMutedState(n); }

  function start(id: ScenarioId) {
    setScenarioId(id);
    setHistory([]);
    setStartedAt(Date.now());
    setRemaining(DUEL_DURATION_SECONDS);
    setWarned(false);
    setVagueStreak(0);
    setPhase("play");
  }

  async function send() {
    if (!scenarioId || !input.trim() || busy || timeUp) return;
    setBusy(true); setError(null); setHook(null); sfx.send();
    try {
      const res = await fetch("/api/duel/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, message: input.trim(), history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      setHistory((h) => [...h, data.playerMessage, data.buyerMessage]);
      setInput(""); sfx.reply();

      // Vague question tracking
      if (data.vague) {
        const newStreak = vagueStreak + 1;
        setVagueStreak(newStreak);
        if (newStreak >= VAGUE_QUESTION_LIMIT) {
          setHook("[axiom] meeting over. you wasted the room.");
          setTimeout(() => getVerdict(), 1500);
          return;
        } else if (newStreak >= 2) {
          setHook("[axiom] I'm losing interest... ask something worth my time.");
          return;
        }
      } else {
        setVagueStreak(0);
      }

      setHook(hookFor(MAX_PLAYER_TURNS - (turnsUsed + 1)));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const muteBtn = (
    <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18, padding: 4 }}>
      {muted ? "🔇" : "🔊"}
    </button>
  );

  const wrap: React.CSSProperties = { maxWidth: 680, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", width: "100%", boxSizing: "border-box" };

  // === PICK PHASE ===
  if (phase === "pick") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>select scenario // 7 minutes each</div>
              </div>
              <div style={{ marginLeft: "auto" }}>{muteBtn}</div>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>$ ls scenarios/</div>
            <div style={{ display: "grid", gap: 10 }}>
              {SCENARIO_IDS.map((id) => (
                <button key={id} onClick={() => start(id)} className="glow-box" style={{ textAlign: "left", padding: "14px 16px", borderRadius: 8, cursor: "pointer", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 120ms" }}>
                  <div className="accent-text" style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 600 }}>{SCENARIOS[id].title}</div>
                  <div style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 13 }}>{SCENARIOS[id].setup}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // === PLAY + SCORING PHASE ===
  const canSend = turnsUsed < MAX_PLAYER_TURNS && !timeUp;
  const timerDanger = remaining <= DUEL_WARNING_SECONDS;
  return (
    <main style={{ ...wrap, display: "flex", flexDirection: "column", height: "100dvh", padding: 0 }}>
      <div className="terminal-window" style={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", borderRadius: 0, border: "none", borderBottom: "1px solid var(--border)" }}>
        {/* header panel */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <AxiomAvatar size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="accent-text" style={{ fontSize: 14, fontWeight: 700 }}>AXIOM</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>• observing</span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {scenario?.title} — {turnsUsed}/{MAX_PLAYER_TURNS} questions
            </div>
          </div>
          {/* Timer */}
          <div className={timerDanger ? "pulse-timer" : ""} style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: timerDanger ? "var(--accent-danger)" : "var(--accent-primary)" }}>
            {formatTime(remaining)}
          </div>
          {muteBtn}
        </div>

        {/* conversation log */}
        <div style={{ padding: "16px", flex: 1, overflowY: "auto" }}>
          {history.length === 0 && (
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              [session started] selling {scenario?.product} to {scenario?.buyer.name} ({scenario?.buyer.role})<br/>
              [axiom] 7 minutes on the clock. make every question count. go.
            </div>
          )}
          {history.map((m, i) => (
            <div key={i} className={m.role === "player" ? "msg-player" : "msg-buyer"} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>
                {m.role === "player" ? "you >" : `${scenario?.buyer.name} >`}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5 }}>{m.content}</div>
            </div>
          ))}
          {busy && phase === "play" && <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>...</div>}
          {hook && !busy && phase === "play" && (
            <div style={{ color: "var(--accent-primary)", fontSize: 13, marginTop: 4, opacity: 0.8 }}>{hook}</div>
          )}
          {phase === "scoring" && (
            <div className="accent-text glow" style={{ marginTop: 12, fontSize: 14 }}>
              [axiom] evaluating transcript... rendering verdict<span className="cursor"></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* input area */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0, background: "var(--bg-terminal)" }}>
          {error && <div className="danger-text" style={{ fontSize: 13, marginBottom: 8 }}>[error] {error}</div>}
          {canSend ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="accent-text" style={{ fontSize: 14, userSelect: "none" }}>&gt;</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="type your question..."
                disabled={busy}
                className="prompt-input"
                style={{ fontSize: 16 }}
              />
              <button onClick={send} disabled={busy || !input.trim()} className="btn-primary btn" style={{ padding: "10px 18px", minWidth: 44, minHeight: 44 }}>{"↵"}</button>
            </div>
          ) : (
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              {timeUp ? "[axiom] time's up." : "[axiom] no questions remaining."}
            </div>
          )}
          {(!canSend && phase === "play") && (
            <button onClick={getVerdict} disabled={busy} className="glow-box" style={{ marginTop: 10, padding: "12px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#040d08", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "100%" }}>
              ./face-axiom
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
