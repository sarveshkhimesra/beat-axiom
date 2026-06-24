"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CLIENT_SCENARIOS, CLIENT_SCENARIO_IDS } from "@/lib/duel/scenarios-client";
import { DUEL_DURATION_SECONDS, DUEL_WARNING_SECONDS, VAGUE_QUESTION_LIMIT } from "@/lib/duel/config";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import AxiomAvatar from "@/components/AxiomAvatar";

type Phase = "pick" | "brief" | "play" | "scoring";

function hookFor(turnNumber: number): string {
  const lines = [
    "[axiom] good start — keep going.",
    "[axiom] nice probe — keep digging.",
    "[axiom] you're onto something.",
    "[axiom] sharp. clock's ticking.",
    "[axiom] getting somewhere — push deeper.",
    "[axiom] don't let up now.",
    "[axiom] keep the pressure on.",
  ];
  return lines[(turnNumber - 1) % lines.length];
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

  const [phase, setPhase] = useState<Phase>(preselected && CLIENT_SCENARIOS[preselected] ? "brief" : "pick");
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(preselected && CLIENT_SCENARIOS[preselected] ? preselected : null);
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hook, setHook] = useState<string | null>(null);
  const [muted, setMutedState] = useState(false);
  const [playerName, setPlayerName] = useState("");

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

  // iOS Safari: track actual visual viewport height (keyboard shrinks it)
  const [viewHeight, setViewHeight] = useState<string>("100dvh");
  useEffect(() => {
    function updateHeight() {
      if (window.visualViewport) {
        setViewHeight(`${window.visualViewport.height}px`);
      }
    }
    if (window.visualViewport) {
      updateHeight();
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
      return () => {
        window.visualViewport!.removeEventListener("resize", updateHeight);
        window.visualViewport!.removeEventListener("scroll", updateHeight);
      };
    }
  }, []);

  useEffect(() => { setMutedState(isMuted()); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, hook]);


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
        body: JSON.stringify({ scenarioId, history: historyRef.current, playerName: playerName.trim() || undefined }),
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

  function selectScenario(id: ScenarioId) {
    setScenarioId(id);
    setHistory([]);
    historyRef.current = [];
    setPhase("brief");
  }

  function beginMeeting() {
    setStartedAt(Date.now());
    setRemaining(DUEL_DURATION_SECONDS);
    warnedRef.current = false;
    verdictFiredRef.current = false;
    setVagueStreak(0);
    setPhase("play");
    // Track player start (fire-and-forget, don't block the game)
    fetch("/api/duel/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerName: playerName.trim() }),
    }).catch(() => {});
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

      setHook(hookFor(turnsUsed + 1));
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
        <div style={{ padding: "clamp(20px, 5vw, 32px) 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <AxiomAvatar size={40} />
            <div>
              <div className="accent-text" style={{ fontSize: 16, fontWeight: 700 }}>Choose Your Buyer</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>pick a scenario — 10 minutes each</div>
            </div>
            <div style={{ marginLeft: "auto" }}>{muteBtn}</div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {CLIENT_SCENARIO_IDS.map((id) => (
              <button key={id} onClick={() => selectScenario(id)} className="glow-box" style={{ textAlign: "left", padding: "clamp(14px, 4vw, 18px)", borderRadius: 10, cursor: "pointer", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 120ms" }}>
                <div className="accent-text" style={{ fontSize: "clamp(16px, 4vw, 19px)", fontWeight: 600, marginBottom: 6 }}>{CLIENT_SCENARIOS[id].title}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "clamp(13px, 3.5vw, 14px)", lineHeight: 1.6 }}>{CLIENT_SCENARIOS[id].setup}</div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                  <span style={{ opacity: 0.6 }}>your pitch:</span>{" "}
                  <span style={{ color: "var(--text-primary)", opacity: 0.85 }}>{CLIENT_SCENARIOS[id].product}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // === BRIEF PHASE === (read the setup, then start when ready)
  if (phase === "brief" && scenario) {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>MISSION BRIEF</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>read carefully — timer starts when you do</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "clamp(18px, 5vw, 22px)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
                {scenario.title}
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, margin: "0 0 16px 0" }}>
                {scenario.setup}
              </p>

              <div style={{ display: "grid", gap: 10, marginBottom: 0 }}>
                <div style={{ padding: "12px 14px", background: "var(--bg-primary)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>your product:</div>
                  <div style={{ fontSize: 15, color: "var(--text-primary)" }}>
                    <strong>{scenario.product}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--accent-primary)", marginTop: 4 }}>
                    your edge: {scenario.sellerStrength}
                  </div>
                </div>
                <div style={{ padding: "12px 14px", background: "var(--bg-primary)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>the buyer:</div>
                  <div style={{ fontSize: 15, color: "var(--text-primary)" }}>
                    <strong>{scenario.buyer.name}</strong> — {scenario.buyer.role}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                    {scenario.buyer.company}
                  </div>
                </div>
                <div style={{ padding: "12px 14px", background: "var(--bg-primary)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>company intel:</div>
                  <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {scenario.buyer.companyBrief}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: "16px", borderRadius: 10, border: "2px solid var(--accent-primary)", background: "rgba(0, 245, 160, 0.04)" }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-primary)", display: "block", marginBottom: 8 }}>What&apos;s your name?</label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="prompt-input"
                autoFocus
                style={{ fontSize: 18, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-primary)", fontWeight: 500 }}
              />
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>shown on your scorecard when you share</div>
            </div>

            <button
              onClick={beginMeeting}
              disabled={!playerName.trim()}
              className="glow-box"
              style={{ width: "100%", padding: "14px 28px", background: playerName.trim() ? "var(--accent-primary)" : "var(--border)", color: "#040d08", borderRadius: 8, fontSize: 16, fontWeight: 700, border: "none", cursor: playerName.trim() ? "pointer" : "not-allowed", letterSpacing: "0.03em", opacity: playerName.trim() ? 1 : 0.5 }}
            >
              start meeting — 10:00 begins
            </button>
          </div>
        </div>
      </main>
    );
  }

  // === PLAY + SCORING PHASE ===
  const canSend = !timeUp;
  const timerDanger = remaining <= DUEL_WARNING_SECONDS;
  return (
    <main style={{ display: "flex", flexDirection: "column", height: viewHeight, overflow: "hidden", padding: 0, margin: 0, position: "fixed", top: 0, left: 0, right: 0 }}>
      <div aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {hook ?? ""}
      </div>

      {/* HEADER — flex-shrink:0, never scrolls */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "var(--bg-terminal)" }}>
        <AxiomAvatar size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {scenario?.title}
          </div>
        </div>
        <div className={timerDanger ? "pulse-timer" : ""} style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: timerDanger ? "var(--accent-danger)" : "var(--accent-primary)" }}>
          {formatTime(remaining)}
        </div>
        {muteBtn}
      </div>

      {/* BRIEF BAR — flex-shrink:0, never scrolls */}
      <div style={{ padding: "6px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-primary)", fontSize: 11, color: "var(--text-secondary)", flexShrink: 0, display: "flex", flexWrap: "wrap", gap: "2px 12px" }}>
        <span><strong style={{ color: "var(--text-primary)" }}>{scenario?.buyer.name}</strong> @ {scenario?.buyer.company}</span>
        <span>Pitching: <span style={{ color: "var(--text-primary)" }}>{scenario?.product}</span></span>
        <span>Edge: <span style={{ color: "var(--accent-primary)" }}>{scenario?.sellerStrength}</span></span>
      </div>

      {/* MESSAGES — only this section scrolls */}
      <div style={{ padding: "16px", flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {history.length === 0 && (
            <div className="system-msg">
              {scenario?.buyer.name} ({scenario?.buyer.role}) · 10 min · go
            </div>
          )}
          {history.map((m, i) => (
            m.role === "player" ? (
              <div key={i} className="bubble-player">{m.content}</div>
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(i === 1 || history[i - 1]?.role === "player") && (
                  <div className="bubble-buyer-label">{scenario?.buyer.name}</div>
                )}
                <div className="bubble-buyer">{m.content}</div>
              </div>
            )
          ))}
          {busy && phase === "play" && <div className="typing-bubble">...</div>}
          {hook && !busy && phase === "play" && (
            <div className="system-msg">{hook}</div>
          )}
          {phase === "scoring" && (
            <div className="system-msg">
              evaluating transcript... rendering verdict<span className="cursor"></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

      {/* INPUT — flex-shrink:0, never scrolls */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0, background: "var(--bg-terminal)" }}>
        {error && <div className="danger-text" style={{ fontSize: 13, marginBottom: 8 }}>[error] {error}</div>}
        {canSend ? (
          <div>
            {history.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--accent-primary)", marginBottom: 8, fontWeight: 500 }}>
                Type your opening line below and hit send
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-primary)" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={history.length === 0 ? "Start the conversation..." : "Ask your next question..."}
                disabled={busy}
                autoFocus
                className="prompt-input"
                rows={Math.min(4, Math.max(1, input.split("\n").length))}
                style={{ fontSize: 16, resize: "none", lineHeight: 1.5, minHeight: 44, maxHeight: 120, overflowY: "auto", border: "none", padding: 0, background: "transparent" }}
                aria-label="Type your sales question to the AI buyer"
              />
              <button onClick={send} disabled={busy || !input.trim()} className="btn-primary btn" style={{ padding: "10px 18px", minWidth: 48, minHeight: 48, borderRadius: 8, fontSize: 18 }}>{"↵"}</button>
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {"[axiom] time's up."}
          </div>
        )}
        {canSend && turnsUsed >= 1 && phase === "play" && !busy && (
          <button onClick={getVerdict} style={{ marginTop: 10, padding: "8px 16px", borderRadius: 6, background: "none", border: "1px solid var(--border)", cursor: "pointer", fontSize: 13, color: "var(--text-secondary)", width: "100%", transition: "border-color 120ms" }}>
            end meeting early &amp; get scored
          </button>
        )}
        {(!canSend && phase === "play") && (
          <button onClick={getVerdict} disabled={busy} className="glow-box" style={{ marginTop: 10, padding: "12px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#040d08", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "100%" }}>
            ./face-axiom
          </button>
        )}
      </div>
    </main>
  );
}
