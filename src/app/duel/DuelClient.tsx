"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, SCENARIO_IDS } from "@/lib/duel/scenarios";
import { MAX_PLAYER_TURNS } from "@/lib/duel/config";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import { useSpeech } from "@/lib/duel/useSpeech";
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

export default function DuelClient() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);

  const speech = useSpeech((t) => setInput(t));

  useEffect(() => { setMutedState(isMuted()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const turnsUsed = history.filter((m) => m.role === "player").length;
  const scenario = scenarioId ? SCENARIOS[scenarioId] : null;

  function toggleMute() { const n = !muted; setMuted(n); setMutedState(n); }

  function start(id: ScenarioId) { setScenarioId(id); setHistory([]); setPhase("play"); }

  async function send() {
    if (!scenarioId || !input.trim() || busy) return;
    if (speech.listening) speech.toggle();
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
      setHook(hookFor(MAX_PLAYER_TURNS - (turnsUsed + 1)));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function getVerdict() {
    if (!scenarioId || busy) return;
    if (speech.listening) speech.toggle();
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
  }

  const muteBtn = (
    <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18, padding: 4 }}>
      {muted ? "🔇" : "🔊"}
    </button>
  );

  const wrap: React.CSSProperties = { maxWidth: 680, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)", width: "100%", boxSizing: "border-box" };

  // === PICK PHASE === (terminal style)
  if (phase === "pick") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>select scenario // {MAX_PLAYER_TURNS} questions each</div>
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

  // === PLAY + SCORING PHASE === (terminal session)
  const canSend = turnsUsed < MAX_PLAYER_TURNS;
  return (
    <main style={wrap}>
      <div className="terminal-window" style={{ padding: 0 }}>
        {/* header panel with AXIOM + status */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <AxiomAvatar size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="accent-text" style={{ fontSize: 14, fontWeight: 700 }}>AXIOM</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>• observing</span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {scenario?.title} — {turnsUsed}/{MAX_PLAYER_TURNS} questions used
            </div>
          </div>
          {muteBtn}
        </div>

        {/* conversation log */}
        <div style={{ padding: "16px", minHeight: 200, maxHeight: "55vh", overflowY: "auto" }}>
          {history.length === 0 && (
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              [session started] selling {scenario?.product} to {scenario?.buyer.name} ({scenario?.buyer.role})<br/>
              [axiom] make every question count. go.
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
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
          {error && <div className="danger-text" style={{ fontSize: 13, marginBottom: 8 }}>[error] {error}</div>}
          {canSend ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="accent-text" style={{ fontSize: 14, userSelect: "none" }}>&gt;</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={speech.listening ? "listening..." : "ask a sharp question"}
                disabled={busy}
                className="prompt-input"
              />
              {speech.supported && (
                <button onClick={() => speech.toggle()} disabled={busy} aria-label="Voice" style={{ background: speech.listening ? "var(--accent-danger)" : "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: speech.listening ? "#fff" : "var(--text-secondary)" }}>
                  🎤
                </button>
              )}
              <button onClick={send} disabled={busy || !input.trim()} className="btn-primary btn" style={{ padding: "6px 14px" }}>↵</button>
            </div>
          ) : (
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>[axiom] no questions remaining.</div>
          )}
          {turnsUsed >= 2 && canSend && (
            <button onClick={getVerdict} disabled={busy} className="glow-box" style={{ marginTop: 10, padding: "10px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#040d08", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "100%" }}>
              ./face-axiom
            </button>
          )}
          {!canSend && (
            <button onClick={getVerdict} disabled={busy} className="glow-box" style={{ marginTop: 10, padding: "10px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#040d08", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "100%" }}>
              ./face-axiom
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
