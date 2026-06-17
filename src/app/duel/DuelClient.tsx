"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, SCENARIO_IDS } from "@/lib/duel/scenarios";
import { MAX_PLAYER_TURNS, MAX_MESSAGE_CHARS } from "@/lib/duel/config";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import { useSpeech } from "@/lib/duel/useSpeech";
import AxiomAvatar from "@/components/AxiomAvatar";

type Phase = "pick" | "play" | "scoring";

/** A short, motivating beat shown after each answer to keep players hooked. */
function hookFor(left: number): string {
  if (left <= 0) return "Out of questions — time to face AXIOM.";
  const lines = [
    `Good going — ${left} to go.`,
    `Nice probe. ${left} left — keep digging.`,
    `You're onto something. ${left} to go.`,
    `Sharp. ${left} left to land the deal.`,
  ];
  return lines[(MAX_PLAYER_TURNS - left) % lines.length];
}

export default function DuelClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);

  const speech = useSpeech((t) => setInput(t.slice(0, MAX_MESSAGE_CHARS)));

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const turnsUsed = history.filter((m) => m.role === "player").length;
  const scenario = scenarioId ? SCENARIOS[scenarioId] : null;

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }

  function start(id: ScenarioId) {
    setScenarioId(id);
    setHistory([]);
    setPhase("play");
  }

  async function send() {
    if (!scenarioId || !input.trim() || busy) return;
    if (speech.listening) speech.toggle();
    setBusy(true);
    setError(null);
    setHook(null);
    sfx.send();
    try {
      const res = await fetch("/api/duel/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, message: input.trim(), history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      setHistory((h) => [...h, data.playerMessage, data.buyerMessage]);
      setInput("");
      sfx.reply();
      setHook(hookFor(MAX_PLAYER_TURNS - (turnsUsed + 1)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function getVerdict() {
    if (!scenarioId || busy) return;
    if (speech.listening) speech.toggle();
    setBusy(true);
    setError(null);
    setPhase("scoring");
    try {
      const res = await fetch("/api/duel/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenarioId, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      router.push(`/r/${data.session.shareId}`);
    } catch (e) {
      setError((e as Error).message);
      setPhase("play");
    } finally {
      setBusy(false);
    }
  }

  const muteBtn = (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 20, padding: 4 }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );

  const wrap: React.CSSProperties = { maxWidth: 720, margin: "0 auto", padding: "clamp(20px, 5vw, 40px)", width: "100%", boxSizing: "border-box" };

  if (phase === "pick") {
    return (
      <main style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="font-mono-display accent-text" style={{ fontSize: "clamp(26px, 6vw, 36px)" }}>Pick your fight</h1>
          {muteBtn}
        </div>
        <p style={{ color: "var(--text-secondary)" }}>One buyer. {MAX_PLAYER_TURNS} questions. Win the deal.</p>
        <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
          {SCENARIO_IDS.map((id) => (
            <button key={id} onClick={() => start(id)} className="surface" style={{ textAlign: "left", padding: 18, borderRadius: 10, cursor: "pointer", color: "var(--text-primary)" }}>
              <div className="font-mono-display" style={{ fontSize: "clamp(18px, 4.5vw, 22px)" }}>{SCENARIOS[id].title}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 6, fontSize: 15 }}>{SCENARIOS[id].setup}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const canSend = turnsUsed < MAX_PLAYER_TURNS;

  return (
    <main style={wrap}>
      <div className="font-mono-display" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: "clamp(12px, 3.2vw, 14px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <AxiomAvatar size={30} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scenario?.title} · {turnsUsed}/{MAX_PLAYER_TURNS} questions</span>
        </div>
        {muteBtn}
      </div>
      <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {history.map((m, i) => (
          <div key={i} className={m.role === "player" ? "" : "surface"} style={{ padding: 12, borderRadius: 10, alignSelf: m.role === "player" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "player" ? "var(--accent-secondary)" : undefined }}>
            <div style={{ fontSize: 12, color: m.role === "player" ? "rgba(255,255,255,0.7)" : "var(--text-secondary)" }}>{m.role === "player" ? "You" : scenario?.buyer.name}</div>
            <div style={{ fontSize: 16, lineHeight: 1.4 }}>{m.content}</div>
          </div>
        ))}
        {busy && phase === "play" && <div style={{ color: "var(--text-secondary)" }}>…thinking</div>}
        {hook && !busy && phase === "play" && (
          <div className="accent-text font-mono-display" style={{ fontSize: 14, alignSelf: "center" }}>{hook}</div>
        )}
        {phase === "scoring" && <div className="accent-text">AXIOM is rendering its verdict…</div>}
      </div>
      {error && <div className="danger-text" style={{ marginBottom: 12 }}>{error}</div>}
      {canSend ? (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <input
              value={input}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={speech.listening ? "Listening… speak now" : "Ask a sharp question…"}
              disabled={busy}
              style={{ flex: 1, minWidth: 0, padding: 14, fontSize: 16, background: "var(--bg-surface)", border: `1px solid ${speech.listening ? "var(--accent-primary)" : "var(--border)"}`, color: "var(--text-primary)", borderRadius: 10 }}
            />
            {speech.supported && (
              <button
                onClick={() => speech.toggle()}
                disabled={busy}
                aria-label={speech.listening ? "Stop voice input" : "Speak your question"}
                title="Speak instead of typing"
                style={{ padding: "0 16px", borderRadius: 10, cursor: "pointer", fontSize: 20, border: "1px solid var(--border)", background: speech.listening ? "var(--accent-danger)" : "var(--bg-surface)", color: speech.listening ? "#fff" : "var(--text-primary)" }}
              >
                🎤
              </button>
            )}
            <button onClick={send} disabled={busy} className="accent-text surface" style={{ padding: "0 20px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 600 }}>Send</button>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
            {speech.supported ? "Type or tap 🎤 to speak." : "Type your question."} {input.length}/{MAX_MESSAGE_CHARS}
          </div>
        </>
      ) : (
        <div style={{ color: "var(--text-secondary)" }}>Out of questions.</div>
      )}
      {turnsUsed >= 2 && (
        <button onClick={getVerdict} disabled={busy} className="font-mono-display" style={{ marginTop: 16, padding: "14px 22px", borderRadius: 10, background: "var(--accent-primary)", color: "#04110b", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, width: "100%", maxWidth: 280 }}>
          Face AXIOM →
        </button>
      )}
    </main>
  );
}
