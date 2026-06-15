"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIOS, SCENARIO_IDS } from "@/lib/duel/scenarios";
import { MAX_PLAYER_TURNS, MAX_MESSAGE_CHARS } from "@/lib/duel/config";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";

type Phase = "pick" | "play" | "scoring";

export default function DuelClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnsUsed = history.filter((m) => m.role === "player").length;
  const scenario = scenarioId ? SCENARIOS[scenarioId] : null;

  function start(id: ScenarioId) {
    setScenarioId(id);
    setHistory([]);
    setPhase("play");
  }

  async function send() {
    if (!scenarioId || !input.trim() || busy) return;
    setBusy(true);
    setError(null);
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function getVerdict() {
    if (!scenarioId || busy) return;
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

  if (phase === "pick") {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 48 }}>
        <h1 className="font-mono-display accent-text" style={{ fontSize: 36 }}>Pick your fight</h1>
        <p style={{ color: "var(--text-secondary)" }}>One buyer. ~{MAX_PLAYER_TURNS} messages. Win the deal.</p>
        <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
          {SCENARIO_IDS.map((id) => (
            <button key={id} onClick={() => start(id)} className="surface" style={{ textAlign: "left", padding: 20, borderRadius: 10, cursor: "pointer", color: "var(--text-primary)" }}>
              <div className="font-mono-display" style={{ fontSize: 22 }}>{SCENARIOS[id].title}</div>
              <div style={{ color: "var(--text-secondary)", marginTop: 6 }}>{SCENARIOS[id].setup}</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const canSend = turnsUsed < MAX_PLAYER_TURNS;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <div className="font-mono-display" style={{ color: "var(--text-secondary)" }}>
        {scenario?.title} · selling {scenario?.product} · {turnsUsed}/{MAX_PLAYER_TURNS} messages
      </div>
      <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {history.map((m, i) => (
          <div key={i} className={m.role === "player" ? "" : "surface"} style={{ padding: 12, borderRadius: 8, alignSelf: m.role === "player" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.role === "player" ? "var(--accent-secondary)" : undefined }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{m.role === "player" ? "You" : scenario?.buyer.name}</div>
            <div>{m.content}</div>
          </div>
        ))}
        {busy && phase === "play" && <div style={{ color: "var(--text-secondary)" }}>…thinking</div>}
        {phase === "scoring" && <div className="accent-text">AXIOM is rendering its verdict…</div>}
      </div>
      {error && <div className="danger-text" style={{ marginBottom: 12 }}>{error}</div>}
      {canSend ? (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            maxLength={MAX_MESSAGE_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a sharp question…"
            disabled={busy}
            style={{ flex: 1, padding: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 8 }}
          />
          <button onClick={send} disabled={busy} className="accent-text surface" style={{ padding: "12px 20px", borderRadius: 8, cursor: "pointer" }}>Send</button>
        </div>
      ) : (
        <div style={{ color: "var(--text-secondary)" }}>Out of messages.</div>
      )}
      {turnsUsed >= 2 && (
        <button onClick={getVerdict} disabled={busy} className="font-mono-display" style={{ marginTop: 16, padding: "12px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#04110b", border: "none", cursor: "pointer", fontSize: 16 }}>
          Face AXIOM →
        </button>
      )}
    </main>
  );
}
