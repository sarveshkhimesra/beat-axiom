"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Stage, TemplateId, GeneratedScenario, DuelMessage } from "@/lib/duel/types";
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/duel/templates";
import { getPlayer, createPlayer, recordGame } from "@/lib/duel/player";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import { useSpeech } from "@/lib/duel/useSpeech";
import AxiomAvatar from "@/components/AxiomAvatar";

type Phase = "onboard" | "pick" | "brief" | "play" | "scoring";

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span style={{ fontSize: 11, letterSpacing: 2 }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ color: i <= level ? "var(--accent-primary)" : "var(--border)" }}>●</span>
      ))}
    </span>
  );
}

export default function DuelClient() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("onboard");
  const [nameInput, setNameInput] = useState("");
  const [playerName, setPlayerName] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [scenario, setScenario] = useState<GeneratedScenario | null>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage>("discovery");
  const [stagesReached, setStagesReached] = useState<Stage[]>(["discovery"]);
  const [impatienceLevel, setImpatienceLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hookLine, setHookLine] = useState<string | null>(null);
  const [stageNotification, setStageNotification] = useState<Stage | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [muted, setMutedState] = useState(false);

  const speech = useSpeech({ currentText: input, onText: setInput });

  // Onboarding: check localStorage
  useEffect(() => {
    const p = getPlayer();
    if (p) {
      setPlayerName(p.username);
      setPhase("pick");
    } else {
      setPhase("onboard");
    }
    setMutedState(isMuted());
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, hookLine]);

  function toggleMute() { const n = !muted; setMuted(n); setMutedState(n); }

  function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    createPlayer(name);
    setPlayerName(name);
    setPhase("pick");
  }

  async function pickTemplate(id: TemplateId) {
    setTemplateId(id);
    setLoadingScenario(true);
    setError(null);
    try {
      const res = await fetch("/api/duel/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "start failed");
      setScenario(data.scenario as GeneratedScenario);
      setHistory([]);
      setCurrentStage("discovery");
      setStagesReached(["discovery"]);
      setImpatienceLevel(0);
      setGameOver(false);
      setPhase("brief");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingScenario(false);
    }
  }

  async function send() {
    if (!scenario || !input.trim() || busy || gameOver) return;
    if (speech.listening) speech.pause();
    setBusy(true); setError(null); setHookLine(null); sfx.send();
    try {
      const res = await fetch("/api/duel/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          history,
          scenario,
          currentStage,
          impatienceLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "turn failed");

      const { playerMessage, buyerMessage, stageJustUnlocked, hookLine: hl, gameOver: go } = data;

      setHistory((h) => [...h, playerMessage, buyerMessage]);
      setInput("");
      sfx.reply();

      if (data.currentStage) setCurrentStage(data.currentStage as Stage);
      if (typeof data.impatienceLevel === "number") setImpatienceLevel(data.impatienceLevel);

      if (stageJustUnlocked) {
        setStageNotification(stageJustUnlocked as Stage);
        setStagesReached((prev) =>
          prev.includes(stageJustUnlocked as Stage) ? prev : [...prev, stageJustUnlocked as Stage]
        );
        setTimeout(() => setStageNotification(null), 3000);
      }

      if (hl) setHookLine(hl);

      if (go) {
        setGameOver(true);
        setTimeout(() => triggerVerdict(), 600);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function triggerVerdict() {
    if (!scenario) return;
    setPhase("scoring");
    try {
      const res = await fetch("/api/duel/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario, history, stagesReached }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "verdict failed");
      const sid = data.session.shareId as string;
      const player = getPlayer();
      if (player && templateId) {
        recordGame({
          templateId,
          score: data.session.verdict.score,
          title: data.session.verdict.title,
          shareId: sid,
        });
      }
      router.push(`/r/${sid}`);
    } catch (e) {
      setError((e as Error).message);
      setPhase("play");
    }
  }

  const impatienceColor = impatienceLevel < 0.3
    ? "var(--accent-primary)"
    : impatienceLevel < 0.7
    ? "#f59e0b"
    : "var(--accent-danger)";

  const wrap: React.CSSProperties = {
    maxWidth: 680, margin: "0 auto",
    padding: "clamp(16px, 4vw, 32px)",
    width: "100%", boxSizing: "border-box",
  };

  // === ONBOARD ===
  if (phase === "onboard") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <AxiomAvatar size={40} />
              <div>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>initializing session</div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
              [axiom] before we begin — what should I call you?
            </p>
            <form onSubmit={handleOnboard} style={{ display: "flex", gap: 8 }}>
              <input
                className="prompt-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="your name or handle"
                autoFocus
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary btn" style={{ padding: "6px 16px" }}>
                enter
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // === PICK ===
  if (phase === "pick") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div style={{ flex: 1 }}>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                  {playerName ? `welcome back, ${playerName}` : "select scenario"}
                </div>
              </div>
              <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18, padding: 4 }}>
                {muted ? "🔇" : "🔊"}
              </button>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>$ ls scenarios/</div>
            {error && <div className="danger-text" style={{ fontSize: 13, marginBottom: 12 }}>[error] {error}</div>}
            <div style={{ display: "grid", gap: 10 }}>
              {TEMPLATE_IDS.map((id) => {
                const t = TEMPLATES[id];
                return (
                  <button
                    key={id}
                    onClick={() => pickTemplate(id)}
                    disabled={loadingScenario}
                    className="glow-box"
                    style={{ textAlign: "left", padding: "14px 16px", borderRadius: 8, cursor: "pointer", color: "var(--text-primary)", background: "var(--bg-surface)", border: "1px solid var(--border)", transition: "border-color 120ms", opacity: loadingScenario ? 0.6 : 1 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div className="accent-text" style={{ fontSize: "clamp(14px, 3.5vw, 17px)", fontWeight: 600 }}>{t.title}</div>
                      <DifficultyDots level={t.difficulty} />
                    </div>
                    <div style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 12 }}>{t.description.slice(0, 100)}{t.description.length > 100 ? "…" : ""}</div>
                  </button>
                );
              })}
            </div>
            {loadingScenario && (
              <div style={{ marginTop: 16, color: "var(--accent-primary)", fontSize: 13 }}>
                [axiom] generating scenario<span className="cursor"></span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // === BRIEF ===
  if (phase === "brief" && scenario) {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={36} />
              <div>
                <div className="accent-text" style={{ fontSize: 14, fontWeight: 700 }}>AXIOM // DOSSIER</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{scenario.title}</div>
              </div>
            </div>
            <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "16px 18px", marginBottom: 20, borderLeft: "3px solid var(--accent-primary)" }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>buyer_profile &gt;</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{scenario.buyerName}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12 }}>{scenario.buyerRole} · {scenario.companyName}</div>
              <pre style={{ fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "var(--text-primary)" }}>
                {scenario.brief}
              </pre>
            </div>
            <button
              onClick={() => setPhase("play")}
              className="glow-box"
              style={{ width: "100%", padding: "12px 20px", borderRadius: 8, background: "var(--accent-primary)", color: "#040d08", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700 }}
            >
              ./enter-meeting
            </button>
          </div>
        </div>
      </main>
    );
  }

  // === PLAY + SCORING ===
  if ((phase === "play" || phase === "scoring") && scenario) {
    return (
      <main style={{ ...wrap, position: "relative" }}>
        {/* Brief overlay */}
        {showBrief && (
          <div
            onClick={() => setShowBrief(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "min(420px, 90vw)", background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", padding: "24px 20px", overflowY: "auto", height: "100vh" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="accent-text" style={{ fontSize: 13, fontWeight: 700 }}>DOSSIER</span>
                <button onClick={() => setShowBrief(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18 }}>✕</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{scenario.buyerName}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>{scenario.buyerRole} · {scenario.companyName}</div>
              <pre style={{ fontSize: 12, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "var(--text-secondary)" }}>
                {scenario.brief}
              </pre>
            </div>
          </div>
        )}

        <div className="terminal-window" style={{ padding: 0 }}>
          {/* header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <AxiomAvatar size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="accent-text" style={{ fontSize: 13, fontWeight: 700 }}>AXIOM</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>• observing</span>
                <span style={{ fontSize: 11, color: impatienceColor, marginLeft: 4 }}>
                  [{currentStage}]
                </span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {scenario.title}
              </div>
            </div>
            <button onClick={() => setShowBrief(true)} aria-label="Show brief" title="Show dossier" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, padding: 4 }}>
              📋
            </button>
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, padding: 4 }}>
              {muted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* conversation log */}
          <div style={{ padding: "16px", minHeight: 200, maxHeight: "55vh", overflowY: "auto" }}>
            {history.length === 0 && (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                [session started] meeting {scenario.buyerName} ({scenario.buyerRole})<br />
                [axiom] go.
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={m.role === "player" ? "msg-player" : "msg-buyer"} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, marginBottom: 2, color: m.role === "player" ? "var(--text-secondary)" : impatienceColor }}>
                  {m.role === "player" ? "you >" : `${scenario.buyerName} >`}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.5 }}>{m.content}</div>
              </div>
            ))}

            {/* stage unlock notification */}
            {stageNotification && (
              <div style={{ textAlign: "center", color: "var(--accent-primary)", fontSize: 12, opacity: 0.8, margin: "8px 0", letterSpacing: "0.05em" }}>
                ── stage unlocked: {stageNotification} ──
              </div>
            )}

            {hookLine && !busy && phase === "play" && (
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4, fontStyle: "italic", opacity: 0.8 }}>
                {hookLine}
              </div>
            )}

            {busy && phase === "play" && (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>...</div>
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
            {error && (
              <div className="danger-text" style={{ fontSize: 13, marginBottom: 8 }}>[error] {error}</div>
            )}
            {phase === "play" && !gameOver ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="accent-text" style={{ fontSize: 14, userSelect: "none" }}>&gt;</span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                    placeholder={speech.listening ? "listening — speak freely..." : "type or tap mic to speak"}
                    disabled={busy}
                    className="prompt-input"
                  />
                  {speech.supported && (
                    <button
                      onClick={() => speech.toggle()}
                      disabled={busy}
                      aria-label={speech.listening ? "Pause mic" : "Start mic"}
                      title={speech.listening ? "Pause — your words are safe" : "Speak — press again to pause"}
                      style={{
                        background: speech.listening ? "var(--accent-danger)" : "transparent",
                        border: `1px solid ${speech.listening ? "var(--accent-danger)" : "var(--border)"}`,
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 16,
                        color: speech.listening ? "#fff" : "var(--text-secondary)",
                        animation: speech.listening ? "pulse-glow 1.5s ease-in-out infinite" : "none",
                      }}
                    >
                      {speech.listening ? "⏸" : "🎤"}
                    </button>
                  )}
                  <button onClick={send} disabled={busy || !input.trim()} className="btn-primary btn" style={{ padding: "6px 14px" }}>
                    {"↵"}
                  </button>
                </div>
                {speech.supported && speech.listening && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                    <span style={{ color: "var(--accent-danger)" }}>{"● recording"}</span>
                    {" — speak freely, press pause to stop. press Send when ready."}
                    {speech.interim ? (
                      <span style={{ display: "block", color: "var(--accent-primary)", marginTop: 2, opacity: 0.7 }}>
                        {"hearing: " + speech.interim}
                      </span>
                    ) : null}
                  </div>
                )}
                {speech.supported && !speech.listening && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                    {"tap 🎤 to speak — press again to pause (nothing is lost)."}
                  </div>
                )}
              </>
            ) : phase === "play" && gameOver ? (
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                [axiom] conversation ended — rendering verdict...
              </div>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  // Fallback
  return null;
}
