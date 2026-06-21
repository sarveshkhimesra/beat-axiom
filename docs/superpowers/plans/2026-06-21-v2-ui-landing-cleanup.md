# Beat AXIOM v2 — UI Rewrite, Landing Update, v1 Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite DuelClient.tsx to use v2 API (stages, impatience, dynamic scenarios, onboarding), update landing copy, delete all v1 modules, and get `tsc --noEmit` + `vitest run` + `npm run build` all passing with zero errors.

**Architecture:** Three sequential git commits — DuelClient rewrite (Task 13), landing update (Task 14), then a combined cleanup commit that deletes v1 files, updates shareText/shareText.test, and fixes the scorecard+OG pages for V2Verdict (Task 15). Each commit leaves the repo in a passing state.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind + CSS custom properties, vitest, `@/lib/duel/types` v2 types, localStorage-based PlayerProfile, Web Audio API (sfx), SpeechRecognition (useSpeech)

---

## Codebase Orientation

**Entry points you must understand before touching anything:**

| File | What it does |
|---|---|
| `src/lib/duel/types.ts` | All v2 types: Stage, STAGES, TemplateId, GeneratedScenario, DuelMessage, TurnMetadata, V2Verdict, DuelSession, PlayerProfile |
| `src/lib/duel/config.ts` | SOFT_MAX_TURNS (20), DUEL_PAUSED, RAHUL_MENTION, META_DELIMITER, AVATAR_MODEL, VERDICT_MODEL |
| `src/lib/duel/templates.ts` | TEMPLATES, TEMPLATE_IDS, getTemplate — 8 templates with `.difficulty` (1\|2\|3) |
| `src/lib/duel/player.ts` | getPlayer, savePlayer, createPlayer, recordGame — all localStorage, "use client" |
| `src/lib/duel/sfx.ts` | sfx.send(), sfx.reply(), sfx.reveal(); isMuted(), setMuted() |
| `src/lib/duel/useSpeech.ts` | useSpeech({ currentText, onText }) hook |
| `src/components/AxiomAvatar.tsx` | `<AxiomAvatar size={N} />` — pure SVG, works server+client |
| `src/app/api/duel/start/route.ts` | POST { templateId, filters? } → { scenario: GeneratedScenario } |
| `src/app/api/duel/turn/route.ts` | POST { message, history, scenario, currentStage, impatienceLevel } → TurnMetadata & playerMessage & buyerMessage |
| `src/app/api/duel/verdict/route.ts` | POST { scenario, history, stagesReached } → { session: DuelSession } |
| `src/lib/duel/store.ts` | saveSession, getSession — already uses V2Verdict |
| `src/app/globals.css` | terminal-window, accent-text, glow, glow-box, msg-player, msg-buyer, prompt-input, cursor, muted-text, danger-text |

**v1 files to delete (all tsc errors live here):**
- `src/lib/duel/scenarios.ts` + `.test.ts`
- `src/lib/duel/avatarPrompt.ts` + `.test.ts`
- `src/lib/duel/axiomPrompt.ts` + `.test.ts`
- `src/lib/duel/rubric.ts` + `.test.ts`

**Current tsc error count:** 13 errors across DuelClient.tsx, avatarPrompt.ts, axiomPrompt.ts, rubric.ts, scenarios.ts, shareText.ts, shareText.test.ts  
**Current test count:** 58 passing across 13 files

---

## Task 13: Rewrite DuelClient.tsx

**Files:**
- Modify: `src/app/duel/DuelClient.tsx`

### Phase overview
The component has four phases managed by `useState`:
- `"onboard"` — first visit: username input. Returning: welcome-back screen.
- `"pick"` — template grid with difficulty dots
- `"brief"` — generated scenario brief, "Enter meeting" button
- `"play"` — live conversation + stage indicator + brief overlay toggle
- `"scoring"` — auto-triggered once API returns gameOver=true, shows spinner, calls verdict API, redirects

### Key API contract reminders
- `/api/duel/start` — POST `{ templateId }` → `{ scenario: GeneratedScenario }`
- `/api/duel/turn` — POST `{ message, history, scenario, currentStage, impatienceLevel }` → `{ playerMessage: DuelMessage, buyerMessage: DuelMessage, currentStage: Stage, stageJustUnlocked: Stage | null, impatienceLevel: number, gameOver: boolean, gameOverReason: ..., hookLine: string }`
- `/api/duel/verdict` — POST `{ scenario, history, stagesReached }` → `{ session: DuelSession }`

- [ ] **Step 1: Verify the API shape you'll call**

```bash
grep -n "export async function POST" /Users/sarvesh.khimesra/MY_NEW/the-deal-public/src/app/api/duel/start/route.ts \
  /Users/sarvesh.khimesra/MY_NEW/the-deal-public/src/app/api/duel/turn/route.ts \
  /Users/sarvesh.khimesra/MY_NEW/the-deal-public/src/app/api/duel/verdict/route.ts
```

Expected: three POST handlers found.

- [ ] **Step 2: Write the new DuelClient.tsx**

Replace the entire contents of `src/app/duel/DuelClient.tsx` with:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stage,
  STAGES,
  TemplateId,
  GeneratedScenario,
  DuelMessage,
} from "@/lib/duel/types";
import { SOFT_MAX_TURNS, DUEL_PAUSED } from "@/lib/duel/config";
import { TEMPLATES, TEMPLATE_IDS } from "@/lib/duel/templates";
import { getPlayer, createPlayer, recordGame } from "@/lib/duel/player";
import { sfx, isMuted, setMuted } from "@/lib/duel/sfx";
import { useSpeech } from "@/lib/duel/useSpeech";
import AxiomAvatar from "@/components/AxiomAvatar";

type Phase = "onboard" | "pick" | "brief" | "play" | "scoring";

function impatienceColor(level: number): string {
  if (level < 0.3) return "var(--accent-primary)";
  if (level < 0.7) return "var(--accent-warn)";
  return "var(--accent-danger)";
}

function difficultyDots(d: 1 | 2 | 3): React.ReactNode {
  return (
    <span style={{ letterSpacing: 2 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            color: i <= d ? "var(--accent-primary)" : "var(--text-secondary)",
            fontSize: 10,
          }}
        >
          ●
        </span>
      ))}
    </span>
  );
}

export default function DuelClient() {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);

  // Phase management
  const [phase, setPhase] = useState<Phase>("onboard");

  // Onboarding
  const [username, setUsername] = useState("");
  const [playerName, setPlayerName] = useState<string | null>(null);

  // Scenario selection
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [scenario, setScenario] = useState<GeneratedScenario | null>(null);
  const [generating, setGenerating] = useState(false);

  // Brief overlay
  const [briefOpen, setBriefOpen] = useState(false);

  // Play state
  const [history, setHistory] = useState<DuelMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>("discovery");
  const [stagesReached, setStagesReached] = useState<Set<Stage>>(new Set(["discovery"]));
  const [impatienceLevel, setImpatienceLevel] = useState(0);
  const [hookLine, setHookLine] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);

  // Mute
  const [muted, setMutedState] = useState(false);

  const speech = useSpeech({ currentText: input, onText: setInput });

  useEffect(() => { setMutedState(isMuted()); }, []);

  useEffect(() => {
    // Check for returning player
    const p = getPlayer();
    if (p) {
      setPlayerName(p.username);
      setPhase("pick");
    }
    // else stay on "onboard"
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, logLines]);

  function toggleMute() {
    const n = !muted;
    setMuted(n);
    setMutedState(n);
  }

  function submitUsername() {
    const name = username.trim();
    if (!name) return;
    createPlayer(name);
    setPlayerName(name);
    setPhase("pick");
  }

  async function selectTemplate(id: TemplateId) {
    setTemplateId(id);
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/duel/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed to generate scenario");
      setScenario(data.scenario as GeneratedScenario);
      setHistory([]);
      setLogLines([]);
      setCurrentStage("discovery");
      setStagesReached(new Set(["discovery"]));
      setImpatienceLevel(0);
      setHookLine(null);
      setBriefOpen(false);
      setPhase("brief");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function enterMeeting() {
    setBriefOpen(false);
    setPhase("play");
  }

  async function send() {
    if (!scenario || !input.trim() || busy) return;
    if (speech.listening) speech.pause();
    setBusy(true);
    setError(null);
    setHookLine(null);
    sfx.send();
    const msg = input.trim();
    setInput("");
    try {
      const res = await fetch("/api/duel/turn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history,
          scenario,
          currentStage,
          impatienceLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "turn failed");

      const newHistory: DuelMessage[] = [...history, data.playerMessage, data.buyerMessage];
      setHistory(newHistory);
      sfx.reply();

      // Stage unlock
      if (data.stageJustUnlocked) {
        setLogLines((l) => [
          ...l,
          `── stage unlocked: ${data.stageJustUnlocked} ──`,
        ]);
        setStagesReached((s) => new Set([...s, data.stageJustUnlocked as Stage]));
      }

      setCurrentStage(data.currentStage);
      setImpatienceLevel(data.impatienceLevel);
      if (data.hookLine) setHookLine(data.hookLine);

      if (data.gameOver) {
        setPhase("scoring");
        await triggerVerdict(newHistory, new Set([...stagesReached, data.currentStage]));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function triggerVerdict(
    finalHistory: DuelMessage[],
    finalStages: Set<Stage>,
  ) {
    if (!scenario) return;
    try {
      const res = await fetch("/api/duel/verdict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenario,
          history: finalHistory,
          stagesReached: [...finalStages],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "verdict failed");
      const session = data.session;
      recordGame({
        templateId: session.templateId,
        score: session.verdict.score,
        title: session.verdict.title,
        shareId: session.shareId,
      });
      sfx.reveal();
      router.push(`/r/${session.shareId}`);
    } catch (e) {
      setError((e as Error).message);
      setPhase("play");
    }
  }

  const muteBtn = (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Unmute" : "Mute"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--text-secondary)",
        fontSize: 18,
        padding: 4,
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );

  const wrap: React.CSSProperties = {
    maxWidth: 680,
    margin: "0 auto",
    padding: "clamp(16px, 4vw, 32px)",
    width: "100%",
    boxSizing: "border-box",
  };

  // ── ONBOARD ──
  if (phase === "onboard") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(24px, 5vw, 36px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <AxiomAvatar size={44} />
              <div>
                <div className="accent-text glow" style={{ fontSize: 16, fontWeight: 700 }}>AXIOM</div>
                <div className="muted-text" style={{ fontSize: 11 }}>sales evaluator // ready</div>
              </div>
            </div>
            <div className="muted-text" style={{ fontSize: 13, marginBottom: 8 }}>axiom@beat ~ $</div>
            <div style={{ fontSize: "clamp(16px, 4vw, 20px)", marginBottom: 24 }}>
              Before we begin — what do you go by?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="accent-text" style={{ fontSize: 14, paddingTop: 8 }}>{">"}</span>
              <input
                className="prompt-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitUsername()}
                placeholder="enter username"
                autoFocus
              />
              <button
                onClick={submitUsername}
                disabled={!username.trim()}
                className="btn btn-primary"
                style={{ padding: "6px 16px" }}
              >
                {"↵"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── PICK ──
  if (phase === "pick") {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div style={{ flex: 1 }}>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div className="muted-text" style={{ fontSize: 11 }}>
                  {playerName ? `welcome back, ${playerName}` : "select scenario"}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>{muteBtn}</div>
            </div>
            {error && (
              <div className="danger-text" style={{ fontSize: 13, marginBottom: 12 }}>
                [error] {error}
              </div>
            )}
            <div className="muted-text" style={{ fontSize: 13, marginBottom: 14 }}>
              $ ls scenarios/
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {TEMPLATE_IDS.map((id) => {
                const t = TEMPLATES[id];
                return (
                  <button
                    key={id}
                    onClick={() => selectTemplate(id)}
                    disabled={generating || DUEL_PAUSED}
                    className="glow-box"
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 8,
                      cursor: generating ? "wait" : "pointer",
                      color: "var(--text-primary)",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      transition: "border-color 120ms",
                      opacity: DUEL_PAUSED ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="accent-text" style={{ fontSize: "clamp(14px, 3.5vw, 17px)", fontWeight: 600 }}>
                        {t.title}
                      </span>
                      {difficultyDots(t.difficulty)}
                    </div>
                    <div className="muted-text" style={{ fontSize: 12 }}>{t.description}</div>
                  </button>
                );
              })}
            </div>
            {generating && (
              <div className="accent-text" style={{ marginTop: 14, fontSize: 13 }}>
                [axiom] generating scenario<span className="cursor"></span>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── BRIEF ──
  if (phase === "brief" && scenario) {
    return (
      <main style={wrap}>
        <div className="terminal-window" style={{ padding: 0 }}>
          <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <AxiomAvatar size={40} />
              <div style={{ flex: 1 }}>
                <div className="accent-text" style={{ fontSize: 15, fontWeight: 700 }}>AXIOM</div>
                <div className="muted-text" style={{ fontSize: 11 }}>mission brief</div>
              </div>
              {muteBtn}
            </div>
            <div className="muted-text" style={{ fontSize: 12, marginBottom: 4 }}>$ cat mission.brief</div>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "16px",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 20,
                whiteSpace: "pre-wrap",
              }}
            >
              {scenario.brief}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setScenario(null); setPhase("pick"); }}
                className="btn"
                style={{ padding: "10px 18px" }}
              >
                ← back
              </button>
              <button
                onClick={enterMeeting}
                className="btn btn-primary glow-box"
                style={{ padding: "10px 24px", flex: 1 }}
              >
                Enter meeting →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── PLAY + SCORING ──
  if ((phase === "play" || phase === "scoring") && scenario) {
    const buyerColor = impatienceColor(impatienceLevel);
    return (
      <main style={wrap}>
        {/* brief slide-over overlay */}
        {briefOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(6,8,16,0.85)",
              display: "flex",
              justifyContent: "flex-end",
            }}
            onClick={() => setBriefOpen(false)}
          >
            <div
              style={{
                width: "min(420px, 92vw)",
                height: "100%",
                background: "var(--bg-terminal)",
                borderLeft: "1px solid var(--border)",
                padding: "clamp(16px, 4vw, 28px)",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div className="accent-text" style={{ fontSize: 13, fontWeight: 700 }}>mission brief</div>
                <button
                  onClick={() => setBriefOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 18 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{scenario.brief}</div>
            </div>
          </div>
        )}

        <div className="terminal-window" style={{ padding: 0 }}>
          {/* header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AxiomAvatar size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="accent-text" style={{ fontSize: 13, fontWeight: 700 }}>AXIOM</span>
                <span className="muted-text" style={{ fontSize: 10 }}>• observing</span>
              </div>
              <div className="muted-text" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {scenario.title} — stage: {currentStage}
              </div>
            </div>
            <button
              onClick={() => setBriefOpen(true)}
              title="View mission brief"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              📋
            </button>
            {muteBtn}
          </div>

          {/* conversation log */}
          <div style={{ padding: "14px 16px", minHeight: 200, maxHeight: "55vh", overflowY: "auto" }}>
            {history.length === 0 && (
              <div className="muted-text" style={{ fontSize: 13 }}>
                [session started] meeting {scenario.buyerName} ({scenario.buyerRole}) · {scenario.companyName}
                <br />
                [axiom] go.
              </div>
            )}

            {/* Interleave messages and log lines in order */}
            {(() => {
              const items: Array<{ type: "msg"; msg: DuelMessage; idx: number } | { type: "log"; text: string; idx: number }> = [];
              let logIdx = 0;
              history.forEach((msg, i) => {
                items.push({ type: "msg", msg, idx: i });
                // Insert stage unlock logs after every buyer message
                if (msg.role === "buyer" && logIdx < logLines.length) {
                  items.push({ type: "log", text: logLines[logIdx], idx: logIdx });
                  logIdx++;
                }
              });
              return items.map((item) =>
                item.type === "msg" ? (
                  <div
                    key={`msg-${item.idx}`}
                    className={item.msg.role === "player" ? "msg-player" : "msg-buyer"}
                    style={{ marginBottom: 12 }}
                  >
                    <div style={{ fontSize: 11, marginBottom: 2 }}>
                      {item.msg.role === "player" ? (
                        <span className="muted-text">you &gt;</span>
                      ) : (
                        <span style={{ color: buyerColor }}>{scenario.buyerName} &gt;</span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.5 }}>{item.msg.content}</div>
                  </div>
                ) : (
                  <div
                    key={`log-${item.idx}`}
                    className="muted-text"
                    style={{ fontSize: 11, textAlign: "center", margin: "8px 0", letterSpacing: "0.05em" }}
                  >
                    {item.text}
                  </div>
                )
              );
            })()}

            {busy && phase === "play" && (
              <div className="muted-text" style={{ fontSize: 13 }}>...</div>
            )}
            {hookLine && !busy && phase === "play" && (
              <div style={{ color: "var(--accent-primary)", fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                {hookLine}
              </div>
            )}
            {phase === "scoring" && (
              <div className="accent-text glow" style={{ marginTop: 12, fontSize: 14 }}>
                [axiom] evaluating transcript... rendering verdict<span className="cursor"></span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* input area — hidden during scoring */}
          {phase === "play" && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
              {error && (
                <div className="danger-text" style={{ fontSize: 13, marginBottom: 8 }}>
                  [error] {error}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="accent-text" style={{ fontSize: 14, userSelect: "none" }}>{">"}</span>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={speech.listening ? "listening — speak freely..." : "type or tap mic to speak"}
                  disabled={busy}
                  className="prompt-input"
                />
                {speech.supported && (
                  <button
                    onClick={() => speech.toggle()}
                    disabled={busy}
                    aria-label={speech.listening ? "Pause mic" : "Start mic"}
                    style={{
                      background: speech.listening ? "var(--accent-danger)" : "transparent",
                      border: `1px solid ${speech.listening ? "var(--accent-danger)" : "var(--border)"}`,
                      borderRadius: 6,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 16,
                      color: speech.listening ? "#fff" : "var(--text-secondary)",
                      animation: speech.listening ? "pulse-glow 1.5s ease-in-out infinite" : "none",
                    }}
                  >
                    {speech.listening ? "⏸" : "🎤"}
                  </button>
                )}
                <button
                  onClick={send}
                  disabled={busy || !input.trim()}
                  className="btn-primary btn"
                  style={{ padding: "6px 14px" }}
                >
                  {"↵"}
                </button>
              </div>
              {speech.supported && speech.listening && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
                  <span style={{ color: "var(--accent-danger)" }}>{"● recording"}</span>
                  {" — speak freely, press pause to stop."}
                  {speech.interim ? (
                    <span style={{ display: "block", color: "var(--accent-primary)", marginTop: 2, opacity: 0.7 }}>
                      {"hearing: " + speech.interim}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Fallback (shouldn't be reached)
  return null;
}
```

- [ ] **Step 3: Run tsc to check Task 13 only**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npx tsc --noEmit 2>&1 | grep "DuelClient"
```

Expected: no errors from DuelClient.tsx. (Other files still have errors until Task 15.)

- [ ] **Step 4: Stage and commit Task 13**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public
git add src/app/duel/DuelClient.tsx
git commit -m "feat(v2): rewrite duel UI — stages, impatience, brief overlay, onboarding"
```

Expected: 1 file changed.

---

## Task 14: Update Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the updated landing page**

Replace the entire contents of `src/app/page.tsx` with:

```tsx
import Link from "next/link";
import AxiomAvatar from "@/components/AxiomAvatar";

export const runtime = "nodejs";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "clamp(40px, 10vw, 80px) clamp(16px, 5vw, 28px)",
        position: "relative",
      }}
    >
      {/* subtle corner attribution */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          fontSize: 11,
          color: "var(--text-secondary)",
          opacity: 0.5,
        }}
      >
        rahul kothari built the game
      </div>

      {/* terminal window */}
      <div className="terminal-window" style={{ padding: 0 }}>
        <div
          style={{
            padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)",
          }}
        >
          {/* AXIOM identity */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 24,
            }}
          >
            <AxiomAvatar size={52} />
            <div>
              <div className="accent-text glow" style={{ fontSize: 20, fontWeight: 700 }}>
                AXIOM
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                sales evaluator // online
              </div>
            </div>
          </div>

          {/* typed prompt */}
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>
            axiom@beat ~ $
          </div>
          <h1
            style={{
              fontSize: "clamp(24px, 6vw, 38px)",
              lineHeight: 1.2,
              margin: "0 0 20px 0",
            }}
          >
            An AI that grades your sales instincts{" "}
            <span className="accent-text glow">the way an elite operator would.</span>
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "clamp(14px, 3.8vw, 17px)",
              margin: "0 0 32px 0",
            }}
          >
            A dynamic sales simulation. Prove you can close.
          </p>

          {/* CTA */}
          <Link
            href="/duel"
            className="glow-box"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              background: "var(--accent-primary)",
              color: "#040d08",
              borderRadius: 8,
              fontSize: 17,
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.03em",
            }}
          >
            ./start-duel<span className="cursor"></span>
          </Link>
        </div>
      </div>

      {/* footer */}
      <p
        style={{
          marginTop: 40,
          fontSize: 11,
          color: "var(--text-secondary)",
          textAlign: "center",
          opacity: 0.6,
        }}
      >
        A fictional sales-training simulation. All buyers and scenarios are invented.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Stage and commit Task 14**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public
git add src/app/page.tsx
git commit -m "feat(v2): update landing for dynamic simulation"
```

Expected: 1 file changed.

---

## Task 15: Cleanup — Delete v1, Fix shareText, Fix Scorecard/OG

**Files:**
- Delete: `src/lib/duel/scenarios.ts`, `src/lib/duel/scenarios.test.ts`
- Delete: `src/lib/duel/avatarPrompt.ts`, `src/lib/duel/avatarPrompt.test.ts`
- Delete: `src/lib/duel/axiomPrompt.ts`, `src/lib/duel/axiomPrompt.test.ts`
- Delete: `src/lib/duel/rubric.ts`, `src/lib/duel/rubric.test.ts`
- Modify: `src/lib/duel/shareText.ts`
- Modify: `src/lib/duel/shareText.test.ts`
- Modify: `src/app/r/[shareId]/page.tsx` (type import update only)
- Modify: `src/app/og/[shareId]/route.tsx` (type import update only)

- [ ] **Step 1: Delete v1 files**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public
rm -f src/lib/duel/scenarios.ts src/lib/duel/scenarios.test.ts \
   src/lib/duel/avatarPrompt.ts src/lib/duel/avatarPrompt.test.ts \
   src/lib/duel/axiomPrompt.ts src/lib/duel/axiomPrompt.test.ts \
   src/lib/duel/rubric.ts src/lib/duel/rubric.test.ts
```

Expected: 8 files removed.

- [ ] **Step 2: Rewrite shareText.ts**

Replace all contents of `src/lib/duel/shareText.ts` with:

```ts
import { V2Verdict } from "./types";
import { RAHUL_MENTION } from "./config";

export function buildShareText(verdict: V2Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 140 ? roast.slice(0, 137).trimEnd() + "..." : roast;
  return [
    `AXIOM — the AI ${RAHUL_MENTION} built to grade sales conversations — gave me a ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `Its verdict: "${snippet}"`,
    "",
    `Think you can beat me? ${shareUrl}`,
  ].join("\n");
}
```

- [ ] **Step 3: Rewrite shareText.test.ts**

Replace all contents of `src/lib/duel/shareText.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { buildShareText } from "./shareText";
import { V2Verdict } from "./types";

const verdict: V2Verdict = {
  score: 62,
  title: "Happy Ears",
  stageScores: { discovery: {}, pitch: {}, negotiate: {}, close: {} },
  modifiers: {
    efficiency: 0,
    hiddenPriority: 0,
    walkaway: false,
    genericPenalty: 0,
    prematurePitch: 0,
  },
  bestLine: "x",
  worstLine: "y",
  roast: "A hostage negotiation run by the hostage.",
  stagesSummary: "Discovery (3) → Pitch (4)",
  didDetectSignal: false,
  buyerWalkedAway: false,
};

describe("buildShareText", () => {
  it("includes the score, Rahul mention, and link", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("https://x.test/r/abc");
  });
  it("includes a roast snippet", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t.toLowerCase()).toContain("hostage");
  });
});
```

- [ ] **Step 4: Fix scorecard page imports**

`src/app/r/[shareId]/page.tsx` already imports V2Verdict indirectly through DuelSession from store — check if there are any remaining type references.

Open the file and check line 1 imports. The file currently uses:
- `import { getSession } from "@/lib/duel/store"` ✓ (already uses V2Verdict inside DuelSession)
- `import { buildShareText } from "@/lib/duel/shareText"` ✓ (now takes V2Verdict)

The file references `session.verdict.score`, `session.verdict.title`, `session.verdict.roast`, `session.verdict.bestLine`, `session.verdict.worstLine` — all exist on V2Verdict. The file references `session.scenarioTitle` which exists on DuelSession. No changes needed.

Confirm by running:
```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npx tsc --noEmit 2>&1 | grep "shareId"
```

Expected: no errors from r/[shareId]/page.tsx.

- [ ] **Step 5: Fix OG route imports**

`src/app/og/[shareId]/route.tsx` already uses `session?.verdict.score`, `session?.verdict.title`, `session?.verdict.roast` — all on V2Verdict. The import `import { getSession } from "@/lib/duel/store"` is already correct. No changes needed.

Confirm:
```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npx tsc --noEmit 2>&1 | grep "og"
```

Expected: no errors from og route.

- [ ] **Step 6: Run full tsc and confirm zero errors**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npx tsc --noEmit 2>&1
```

Expected: empty output (zero errors). If there are errors, read them carefully — they will be in files you haven't touched yet. Common causes after v1 deletion:
- Some file still imports from deleted modules → find it with `grep -r "scenarios\|avatarPrompt\|axiomPrompt\|rubric" src/ --include="*.ts" --include="*.tsx" -l`
- A deleted test file is referenced in vitest.config.ts → check `cat vitest.config.ts`
- An API route imports something that no longer exists → check `src/app/api/duel/*/route.ts`

Fix any remaining errors before proceeding.

- [ ] **Step 7: Run vitest and confirm tests pass**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npx vitest run 2>&1
```

Expected: all tests pass. Test count will drop from 58 to approximately 30 (losing the v1 test files). The remaining tests should be: transcript, percentile, scoring, templates, shareText (2), parseMeta, buyerPrompt, verdictPrompt, player, and any new v2 tests. Zero failures.

- [ ] **Step 8: Run build**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public && npm run build 2>&1
```

Expected: "Route (app)" table printed, "✓ Compiled successfully". If there are build errors, check:
- Next.js App Router requires server components to not use "use client" modules at top level — DuelClient is wrapped in `src/app/duel/page.tsx` which should use Suspense. Check that page.tsx doesn't import DuelClient at the server level without dynamic import.
- Check `src/app/duel/page.tsx` — it should have `import dynamic from "next/dynamic"` or similar to avoid hydration issues with player.ts (which uses localStorage).

If build fails on the duel page due to client/server boundary issues:

```bash
cat /Users/sarvesh.khimesra/MY_NEW/the-deal-public/src/app/duel/page.tsx
```

If `src/app/duel/page.tsx` imports DuelClient directly (without dynamic), the build may still pass since DuelClient has "use client" at the top. No action needed if the build passes.

- [ ] **Step 9: Commit Task 15**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public
git add -A
git commit -m "feat(v2): cleanup — delete v1 modules, update share/scorecard for V2Verdict"
```

Expected: multiple files changed/deleted. `git log --oneline -5` should show three new commits on dev/v2.

- [ ] **Step 10: Final verification**

```bash
cd /Users/sarvesh.khimesra/MY_NEW/the-deal-public
echo "=== tsc ===" && npx tsc --noEmit && echo "PASS" || echo "FAIL"
echo "=== vitest ===" && npx vitest run --reporter=verbose 2>&1 | tail -10
echo "=== build ===" && npm run build 2>&1 | tail -5
echo "=== commits ===" && git log --oneline -4
```

Expected:
- tsc: PASS (empty output before PASS)
- vitest: all Tests X passed (0 failed)
- build: ✓ Compiled successfully
- commits: three feat(v2) commits at top

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| "onboard" phase (username / welcome-back) | Task 13 Step 2 — `phase === "onboard"` block |
| "pick" phase with difficulty dots | Task 13 Step 2 — `difficultyDots()` + TEMPLATE_IDS map |
| "brief" phase with "Enter meeting" button | Task 13 Step 2 — `phase === "brief"` block |
| "play" phase | Task 13 Step 2 — `phase === "play"` block |
| "scoring" phase with redirect | Task 13 Step 2 — `triggerVerdict()` + `phase === "scoring"` |
| NO turn counter | ✓ — no turnsUsed variable shown in UI |
| Stage indicator (muted text in header) | Task 13 Step 2 — header `stage: {currentStage}` |
| Stage unlock log line | Task 13 Step 2 — logLines insertion |
| Impatience color on buyer name | Task 13 Step 2 — `impatienceColor()` applied to buyerName |
| Hook lines from API as [axiom] messages | Task 13 Step 2 — `hookLine` state displayed |
| Brief overlay (📋 button → slide-over) | Task 13 Step 2 — `briefOpen` state + slide-over overlay |
| Game ends on gameOver=true → auto-verdict | Task 13 Step 2 — `if (data.gameOver) { setPhase("scoring"); await triggerVerdict(...) }` |
| Voice input + SFX | Task 13 Step 2 — speech hook + sfx.send/reply/reveal all present |
| Landing: "A dynamic sales simulation. Prove you can close." | Task 14 Step 1 |
| Landing: no "seven questions" | Task 14 Step 1 — copy uses "dynamic simulation" |
| Landing: CTA ./start-duel → /duel | Task 14 Step 1 |
| Landing: "rahul kothari built the game" corner | Task 14 Step 1 |
| Delete 8 v1 files | Task 15 Step 1 |
| shareText.ts uses V2Verdict | Task 15 Step 2 |
| shareText.test.ts uses V2Verdict | Task 15 Step 3 |
| Scorecard page works with V2Verdict | Task 15 Step 4 — verified no changes needed |
| OG route works with V2Verdict | Task 15 Step 5 — verified no changes needed |
| tsc --noEmit passes | Task 15 Step 6 |
| vitest run passes | Task 15 Step 7 |
| npm run build passes | Task 15 Step 8 |
| Three separate commits | Tasks 13/14/15 each commit separately |

**Placeholder scan:** No TBDs, all code blocks complete, all paths are absolute.

**Type consistency:**
- `GeneratedScenario` used throughout — imported from `@/lib/duel/types` ✓
- `DuelMessage` — imported, used in `history` and API response ✓
- `Stage` + `STAGES` — Stage used for `currentStage`; STAGES imported but only STAGES[0] used implicitly via "discovery" string literal ✓
- `TemplateId` — used for `templateId` state ✓
- `V2Verdict` — used in both shareText.ts and shareText.test.ts with matching shape ✓
- `stagesReached` is `Set<Stage>` serialized to array `[...stagesReached]` for JSON body ✓
- `recordGame` receives `{ templateId, score, title, shareId }` matching its signature in player.ts ✓
