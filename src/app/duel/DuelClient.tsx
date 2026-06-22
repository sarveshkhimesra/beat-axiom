"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CLIENT_SCENARIOS, CLIENT_SCENARIO_IDS } from "@/lib/duel/scenarios-client";
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

  // T-5: phase and scenarioId are safe string inits; startedAt is moved to useEffect
  const [phase, setPhase] = useState<Phase>(preselected && CLIENT_SCENARIOS[preselected] ? "play" : "pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(preselected && CLIENT_SCENARIOS[preselected] ? preselected : null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);

  // Timer state
  const [startedAt, setStartedAt] = useState<number | null>(null); // T-5: no Date.now() in init
  const [remaining, setRemaining] = useState(DUEL_DURATION_SECONDS);

  // Vague question tracking
  const [vagueStreak, setVagueStreak] = useState(0);

  // B-2: warnedRef instead of warned state (no stale closure in timer)
  const warnedRef = useRef(false);

  // T-4: historyRef for stale closures in setTimeout/callbacks
  const historyRef = useRef<DuelMessage[]>([]);

  // T-2/A-1: verdictFiredRef to prevent infinite verdict loop
  const verdictFiredRef = useRef(false);

  // S-1: busyRef for double-send protection
  const busyRef = useRef(false);

  useEffect(() => { setMutedState(isMuted()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, hook]);

  // T-5: set startedAt on mount if pre-selected scenario is valid
  useEffect(() => {
    if (phase === "play" && !startedAt) {
      setStartedAt(Date.now());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Timer tick — B-2: uses warnedRef, no warned in deps
  useEffect(() => {
    if (phase !== "play" || !startedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, DUEL_DURATION_SECONDS - elapsed);
      setRemaining(left);
      if (left <= DUEL_WARNING_SECONDS && !warnedRef.current) {
        warnedRef.current = true;
        setHook("[axiom] 30 seconds — wrap it up or I'm calling it.");
      }
      if (left <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, startedAt]);

  const turnsUsed = history.filter((m) => m.role === "player").length;
  const scenario = scenarioId ? CLIENT_SCENARIOS[scenarioId] : null;
  const timeUp = remaining <= 0;

  // T-4: use historyRef.current; S-1: busyRef guard; removed busy+history from deps
  const getVerdict = useCallback(async () => {
    if (!scenarioId || busy || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError(null); setPhase("scoring");
    try {
      const res = await fetch("/api/duel/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, history: historyRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      router.push(`/r/${data.session.shareId}`);
    } catch (e) { setError((e as Error).message); setPhase("play"); }
    finally { setBusy(false); busyRef.current = false; }
  }, [scenarioId, busy, router]);

  // Auto-trigger verdict when time runs out — T-2: verdictFiredRef prevents loop
  useEffect(() => {
    if (timeUp && phase === "play" && historyRef.current.length > 0 && !busy && !verdictFiredRef.current) {
      verdictFiredRef.current = true;
      getVerdict();
    }
  }, [timeUp, phase, busy, getVerdict]);

  function toggleMute() { const n = !muted; setMuted(n); setMutedState(n); }

  function start(id: ScenarioId) {
    setScenarioId(id);
    setHistory([]);
    historyRef.current = [];
    setStartedAt(Date.now());
    setRemaining(DUEL_DURATION_SECONDS);
    warnedRef.current = false;
    verdictFiredRef.current = false;
    setVagueStreak(0);
    setPhase("play");
  }

  async function send() {
    if (!scenarioId || !input.trim() || busy || timeUp || busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError(null); setHook(null); sfx.send();
    try {
      const res = await fetch("/api/duel/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, message: input.trim(), history: historyRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      // T-4: update historyRef alongside state
      setHistory((h) => {
        const next = [...h, data.playerMessage, data.buyerMessage];
        historyRef.current = next;
        return next;
      });
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
    finally { setBusy(false); busyRef.current = false; }
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
              {CLIENT_SCENARIO_IDS.map((id) => (
                <button key={id} onClick={() => start(id)} className="glow-box" style={{ textAlign: "left", padding: "14px 16px", borderRadius: 8, cursor: "pointer", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 120ms" }}>
                  <div className="accent-text" style={{ fontSize: "clamp(15px, 4vw, 18px)", fontWeight: 600 }}>{CLIENT_SCENARIOS[id].title}</div>
                  <div style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 13 }}>{CLIENT_SCENARIOS[id].setup}</div>
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
        <div aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
          {hook ?? ""}
        </div>
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
          {/* End meeting early */}
          {turnsUsed >= 1 && phase === "play" && !busy && (
            <button
              onClick={getVerdict}
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "var(--text-secondary)", fontSize: 11, whiteSpace: "nowrap", transition: "border-color 120ms" }}
              title="End meeting early and get scored"
            >
              end meeting
            </button>
          )}
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
                aria-label="Type your sales question to the AI buyer"
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
