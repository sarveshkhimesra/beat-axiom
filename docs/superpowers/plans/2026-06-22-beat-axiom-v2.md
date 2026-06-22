# Beat AXIOM v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Beat AXIOM into a 5-scenario, time-limited, mobile-friendly, playful sales game optimized for LinkedIn/Twitter virality.

**Architecture:** Client-side timer with 7-minute countdown. Vague question detection via LLM response parsing. Two new scenarios added to the existing data structure. Voice transcription removed entirely. Mobile responsiveness via CSS media queries and sticky input.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Anthropic Claude API, vitest

## Global Constraints

- Next.js 14 App Router (no Pages Router)
- All client components use `"use client"` directive
- No new dependencies — use existing stack only
- Inline styles used throughout (existing pattern) — extend with Tailwind utility classes for responsive additions
- `ScenarioId` is a union type that must be updated before any scenario-related code
- Timer is client-side only (no server validation)
- All text copy: playful game-show energy, never harsh or mean

---

### Task 1: Remove Voice Transcription

**Files:**
- Delete: `src/lib/duel/useSpeech.ts`
- Delete: `src/lib/duel/transcript.ts`
- Delete: `src/lib/duel/transcript.test.ts`
- Modify: `src/app/duel/DuelClient.tsx`

**Interfaces:**
- Consumes: nothing external
- Produces: Cleaned `DuelClient.tsx` without any speech/mic references (later tasks build on this file)

- [ ] **Step 1: Delete speech and transcript files**

```bash
rm src/lib/duel/useSpeech.ts src/lib/duel/transcript.ts src/lib/duel/transcript.test.ts
```

- [ ] **Step 2: Remove speech imports and usage from DuelClient.tsx**

In `src/app/duel/DuelClient.tsx`:

Remove the import:
```typescript
import { useSpeech } from "@/lib/duel/useSpeech";
```

Remove the hook call:
```typescript
const speech = useSpeech({ currentText: input, onText: setInput });
```

In `send()` function, remove:
```typescript
if (speech.listening) speech.pause();
```

In `getVerdict()` function, remove:
```typescript
if (speech.listening) speech.pause();
```

- [ ] **Step 3: Remove mic button and recording UI from the input area**

Replace the entire input area section (the `{canSend ? (` block, lines 173-219) with this simplified version:

```tsx
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
    />
    <button onClick={send} disabled={busy || !input.trim()} className="btn-primary btn" style={{ padding: "6px 14px" }}>{"↵"}</button>
  </div>
) : (
  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{"[axiom] no questions remaining."}</div>
)}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: Build succeeds with no errors about missing speech/transcript modules.

- [ ] **Step 5: Run remaining tests**

```bash
npm test
```

Expected: All remaining tests pass (speech-related tests were deleted).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove voice transcription — text-only input"
```

---

### Task 2: Add New Scenarios + Update Types

**Files:**
- Modify: `src/lib/duel/types.ts`
- Modify: `src/lib/duel/scenarios.ts`
- Modify: `src/lib/duel/scenarios.test.ts`

**Interfaces:**
- Consumes: existing `Scenario` and `Buyer` interfaces
- Produces: Updated `ScenarioId` union with 5 values, `SCENARIOS` record with 5 entries, `SCENARIO_IDS` array with 5 entries

- [ ] **Step 1: Update ScenarioId type**

In `src/lib/duel/types.ts`, replace line 1:

```typescript
export type ScenarioId = "skeptical-vp" | "cutting-cfo" | "committee-gatekeeper" | "enthusiastic-champion" | "silent-evaluator";
```

- [ ] **Step 2: Add the two new scenarios to scenarios.ts**

In `src/lib/duel/scenarios.ts`, add these two entries to the `SCENARIOS` record (after the `"committee-gatekeeper"` entry, before the closing `};`):

```typescript
  "enthusiastic-champion": {
    id: "enthusiastic-champion",
    title: "The Enthusiastic Champion",
    product: "a workflow-automation platform",
    sellerStrength: "intuitive UX — teams adopt it without training",
    sellerWeakness: "limited enterprise security certifications (SOC2 pending)",
    setup:
      "You're selling a workflow-automation platform to an internal champion who loves you — but can't sign. You have ~7 messages to win the deal.",
    buyer: {
      name: "Ethan Morales",
      role: "Senior Product Manager",
      personality:
        "Energetic, talkative, wants to help you win. Drops names of internal stakeholders freely. Gets visibly excited about features. But subtly deflects when asked about budget or sign-off authority.",
      surfacePains: [
        "Manual handoffs between teams cause 2-day delays on every project",
        "He personally built spreadsheet workarounds that break constantly",
        "His team loves the idea of automation but leadership hasn't prioritized it",
      ],
      hiddenPriority:
        "Ethan has no purchase authority. His VP (who he mentions casually) is the actual buyer, and she's skeptical of Ethan's 'shiny object' tendency. Ethan needs a way to present this as HER strategic win, not his pet project.",
      hiddenPriorityHintTopics: [
        "who actually signs off on purchases",
        "what happened to Ethan's last recommendation",
        "the VP's priorities and what she cares about",
        "how purchase decisions actually get made here",
      ],
      signatureObjection:
        "Look, I'm totally sold — but my VP is going to ask why we need another tool when we just bought something similar six months ago. I need you to help me answer that.",
      budgetSignal:
        "Budget exists at the VP level for 'strategic ops investments' — but Ethan can't access it directly. He needs ammunition, not approval.",
    },
  },
  "silent-evaluator": {
    id: "silent-evaluator",
    title: "The Silent Technical Evaluator",
    product: "a developer-infrastructure platform",
    sellerStrength: "10x faster CI/CD pipelines — proven benchmarks",
    sellerWeakness: "requires migration effort from existing toolchain",
    setup:
      "You're selling a dev-infrastructure platform to a principal engineer who barely speaks. You have ~7 messages to win the deal.",
    buyer: {
      name: "Dr. Lena Karim",
      role: "Principal Engineer",
      personality:
        "Laconic. Responds in 1–2 sentences max. Never asks clarifying questions — just waits. Visibly unimpressed by marketing language. Warms up ONLY to specifics, benchmarks, architecture details, and honest trade-off admissions.",
      surfacePains: [
        "Current CI takes 45 minutes; developers context-switch and lose flow",
        "The team has outgrown their Jenkins setup but nobody wants to own migration",
        "On-call is painful because deploy rollbacks are manual and slow",
      ],
      hiddenPriority:
        "Lena's team lost their best engineer last month — partly because the tooling was embarrassing. She needs to show the remaining team that leadership is investing in developer experience. It's a retention play disguised as an infrastructure upgrade.",
      hiddenPriorityHintTopics: [
        "team morale and how the team is feeling",
        "recent departures or attrition",
        "what the team actually complains about day to day",
        "developer experience as a retention lever",
      ],
      signatureObjection:
        "What's the migration path? We're not rewriting our pipeline configs for a marginal improvement.",
      budgetSignal:
        "Budget is pre-approved for 'platform modernization' but Lena will reject anything that creates more work for her already-stretched team. The pitch must be low-migration-effort.",
    },
  },
```

- [ ] **Step 3: Update the scenarios test**

In `src/lib/duel/scenarios.test.ts`, verify the test still checks all scenarios (the existing test likely iterates over `SCENARIO_IDS`). Run:

```bash
npm test -- src/lib/duel/scenarios.test.ts
```

Expected: All tests pass — the test iterates `SCENARIO_IDS` dynamically so new scenarios are covered automatically.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/types.ts src/lib/duel/scenarios.ts src/lib/duel/scenarios.test.ts
git commit -m "feat: add 2 new scenarios (champion + silent evaluator)"
```

---

### Task 3: Add Timer + Vague Question Config

**Files:**
- Modify: `src/lib/duel/config.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `DUEL_DURATION_SECONDS` (420), `DUEL_WARNING_SECONDS` (30), `VAGUE_QUESTION_LIMIT` (3) — exported constants used by DuelClient and avatar route

- [ ] **Step 1: Add timer and vague-question constants to config.ts**

In `src/lib/duel/config.ts`, add after the `MAX_MESSAGE_CHARS` line:

```typescript
/** Total duel duration in seconds (7 minutes). */
export const DUEL_DURATION_SECONDS = 420;
/** Seconds remaining when the timer warning fires. */
export const DUEL_WARNING_SECONDS = 30;
/** Consecutive vague questions before AXIOM ends the meeting. */
export const VAGUE_QUESTION_LIMIT = 3;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/duel/config.ts
git commit -m "feat: add timer and vague-question config constants"
```

---

### Task 4: Vague Question Detection in Avatar API

**Files:**
- Modify: `src/lib/duel/avatarPrompt.ts`
- Modify: `src/app/api/duel/avatar/route.ts`

**Interfaces:**
- Consumes: `buildBuyerPrompt()`, `AVATAR_MODEL`, existing route structure
- Produces: Avatar API response now includes `vague: boolean` field alongside existing `playerMessage`, `buyerMessage`, `turnsUsed`, `turnsLeft`

- [ ] **Step 1: Add vague-detection instruction to buyer prompt**

In `src/lib/duel/avatarPrompt.ts`, add this block at the end of the `buildBuyerPrompt` return string (before the closing backtick):

```typescript
`
VAGUE QUESTION DETECTION:
After writing your reply, assess whether the salesperson's question was vague/generic (e.g. "what are your goals?", "tell me about your challenges", "what keeps you up at night?" — anything that requires zero preparation or research).
On the VERY LAST LINE of your response, append exactly one of:
[VAGUE:true]
[VAGUE:false]
This tag will be stripped before showing to the player. Be fair — a question is only vague if it could be asked to literally any buyer without modification.`;
```

- [ ] **Step 2: Parse vague tag in avatar route**

In `src/app/api/duel/avatar/route.ts`, after `const reply = extractText(completion);` (line 65), add parsing logic:

```typescript
    const vagueMatcher = /\[VAGUE:(true|false)\]\s*$/;
    const vagueMatch = reply.match(vagueMatcher);
    const vague = vagueMatch ? vagueMatch[1] === "true" : false;
    const cleanReply = reply.replace(vagueMatcher, "").trim();
```

Then update the response to use `cleanReply` instead of `reply` and add the `vague` field:

```typescript
    return NextResponse.json({
      playerMessage: { role: "player", content: message, at: now } as DuelMessage,
      buyerMessage: { role: "buyer", content: cleanReply, at: now + 1 } as DuelMessage,
      turnsUsed: askedSoFar + 1,
      turnsLeft: MAX_PLAYER_TURNS - (askedSoFar + 1),
      vague,
    });
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/avatarPrompt.ts src/app/api/duel/avatar/route.ts
git commit -m "feat: detect vague questions via LLM tag in avatar response"
```

---

### Task 5: Update AXIOM Verdict Tone

**Files:**
- Modify: `src/lib/duel/axiomPrompt.ts`
- Modify: `src/lib/duel/shareText.ts`

**Interfaces:**
- Consumes: `buildAxiomVerdictPrompt()`, `buildShareText()`
- Produces: Updated prompt with game-show energy; updated share text with playful framing

- [ ] **Step 1: Update AXIOM personality in axiomPrompt.ts**

In `src/lib/duel/axiomPrompt.ts`, replace the `PERSONALITY` and `ROAST STYLE GUIDE` sections (lines 9-12 of the prompt string) with:

```typescript
  return `You are AXIOM, an AI sales evaluator built by Rahul Kothari. Your job: score one salesperson's performance in a single short sales conversation (about seven questions), sharply and fairly.

PERSONALITY: A charismatic game-show host who genuinely wants contestants to succeed — but won't lie to them. Witty, warm, teasing. You celebrate great moves and gently roast bad ones. Think: the host who makes losing feel fun enough to try again.

ROAST STYLE GUIDE (hard rules — Rahul's name is on this):
- Be witty and playful about the WORK, never the person. Tease the move, not the human.
- Never reference identity, appearance, or anything protected. Never punch down. Never be crude.
- A great roast is something the player would laugh at and proudly post. If it would make them feel small rather than amused, rewrite it.
- ALWAYS include one genuine compliment — something they actually did well, even in a low-scoring game.
- Low scores should still feel fun to share: "you swung big and missed" > "you wasted everyone's time."
`;
```

Keep the rest of the prompt (SCENARIO, SCORING RUBRIC, PENALTIES, ASSESS, OUTPUT) unchanged.

- [ ] **Step 2: Update share text tone**

In `src/lib/duel/shareText.ts`, replace the `buildShareText` function body:

```typescript
export function buildShareText(verdict: Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 140 ? roast.slice(0, 137).trimEnd() + "…" : roast;
  return [
    `Just played Beat AXIOM — the AI sales game ${RAHUL_MENTION} built — and scored ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `AXIOM's take: "${snippet}"`,
    "",
    `7 minutes. 1 AI buyer. Can you beat my score? 👇`,
    shareUrl,
  ].join("\n");
}
```

- [ ] **Step 3: Update share text test**

Run existing share text test:

```bash
npm test -- src/lib/duel/shareText.test.ts
```

If it fails due to changed wording, update assertions to match the new template structure (check for "Just played Beat AXIOM" and "Can you beat my score?").

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/axiomPrompt.ts src/lib/duel/shareText.ts src/lib/duel/shareText.test.ts
git commit -m "feat: update AXIOM tone to playful game-show energy"
```

---

### Task 6: Rewrite DuelClient — Timer + Vague Tracking + Mobile

**Files:**
- Modify: `src/app/duel/DuelClient.tsx`

**Interfaces:**
- Consumes: `DUEL_DURATION_SECONDS`, `DUEL_WARNING_SECONDS`, `VAGUE_QUESTION_LIMIT` from config; `vague` field from avatar API response; `SCENARIOS`, `SCENARIO_IDS`, `MAX_PLAYER_TURNS` from existing imports
- Produces: Fully updated play component with countdown timer, vague-question mechanic, mobile-friendly layout, no pick phase (scenario comes from URL param)

- [ ] **Step 1: Rewrite DuelClient.tsx**

Replace the entire contents of `src/app/duel/DuelClient.tsx` with:

```tsx
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
          // Auto-trigger verdict after a short delay
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

  // === PICK PHASE === (shown if no scenario param)
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

        {/* input area — sticky at bottom */}
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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/duel/DuelClient.tsx
git commit -m "feat: add 7-min timer, vague-question mechanic, mobile layout"
```

---

### Task 7: Rewrite Homepage with Scenario Cards

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `SCENARIOS`, `SCENARIO_IDS` from scenarios.ts; `ScenarioId` type
- Produces: Homepage with AXIOM intro + 5 scenario cards linking to `/duel?scenario={id}`

- [ ] **Step 1: Add scenario card descriptions**

Create a descriptions map to use in the homepage. These go directly in `page.tsx` as a constant (3 relatable lines per scenario):

```tsx
import Link from "next/link";
import AxiomAvatar from "@/components/AxiomAvatar";
import { SCENARIO_IDS, SCENARIOS } from "@/lib/duel/scenarios";
import { ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";

const CARD_COPY: Record<ScenarioId, string[]> = {
  "skeptical-vp": [
    "She's been burned before. That rollout you remind her of? It was hers.",
    "She talks ROI but what she really needs is a visible win — fast.",
    "Convince her this time is different.",
  ],
  "cutting-cfo": [
    "He says it's about cost. It's not.",
    "Under the spreadsheet armor, he wants to look innovative to the board.",
    "Find the real story behind the budget talk.",
  ],
  "committee-gatekeeper": [
    "She'll smile, take notes, and route you to 'the process.'",
    "The real decision-maker isn't in the room.",
    "Figure out who is — and sell through her.",
  ],
  "enthusiastic-champion": [
    "He loves your product. He's your biggest fan internally.",
    "But he can't sign anything — and his VP thinks he chases shiny objects.",
    "Leverage his energy without stepping on his toes.",
  ],
  "silent-evaluator": [
    "She barely speaks. Vague claims get silence.",
    "Hand-waving gets a raised eyebrow. Proof gets engagement.",
    "Earn her respect with specifics — or get nothing.",
  ],
};

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px, 10vw, 80px) clamp(16px, 5vw, 28px)", position: "relative" }}>
      {/* corner attribution */}
      <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, color: "var(--text-secondary)", opacity: 0.5 }}>
        rahul kothari built the game
      </div>

      {/* terminal window — hero */}
      <div className="terminal-window" style={{ padding: 0 }}>
        <div style={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)" }}>
          {/* AXIOM identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <AxiomAvatar size={52} />
            <div>
              <div className="accent-text glow" style={{ fontSize: 20, fontWeight: 700 }}>AXIOM</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>sales evaluator // online</div>
            </div>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: "clamp(24px, 6vw, 38px)", lineHeight: 1.2, margin: "0 0 20px 0" }}>
            Sharpen your sales instincts <span className="accent-text glow">against an AI that fights back.</span>
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 3.8vw, 17px)", margin: "0 0 32px 0" }}>
            One AI buyer. Seven minutes. Can you close the deal?
          </p>

          {/* CTA */}
          <Link
            href="/duel"
            className="glow-box"
            style={{ display: "inline-block", padding: "14px 28px", background: "var(--accent-primary)", color: "#040d08", borderRadius: 8, fontSize: 17, fontWeight: 700, textDecoration: "none", letterSpacing: "0.03em" }}
          >
            ./start-duel<span className="cursor"></span>
          </Link>
        </div>
      </div>

      {/* Scenario cards section */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: "clamp(18px, 5vw, 24px)", marginBottom: 20, color: "var(--text-primary)" }}>
          Choose Your Buyer
        </h2>
        <div style={{ display: "grid", gap: 14 }}>
          {SCENARIO_IDS.map((id) => (
            <Link
              key={id}
              href={`/duel?scenario=${id}`}
              className="glow-box"
              style={{
                display: "block",
                padding: "clamp(16px, 4vw, 20px)",
                borderRadius: 10,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                color: "var(--text-primary)",
                transition: "border-color 120ms",
              }}
            >
              <div className="accent-text" style={{ fontSize: "clamp(16px, 4vw, 19px)", fontWeight: 600, marginBottom: 8 }}>
                {SCENARIOS[id].title}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "clamp(13px, 3.5vw, 15px)", lineHeight: 1.6 }}>
                {CARD_COPY[id].map((line, i) => (
                  <span key={i}>{line}{i < CARD_COPY[id].length - 1 ? " " : ""}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* footer */}
      <p style={{ marginTop: 40, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", opacity: 0.6 }}>
        A fictional sales-training simulation. All buyers and scenarios are invented.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: homepage with 5 scenario cards and playful copy"
```

---

### Task 8: Mobile Responsive CSS

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing CSS variables and class names
- Produces: Media queries for mobile breakpoints, sticky input styling

- [ ] **Step 1: Add mobile responsive styles to globals.css**

Append to the end of `src/app/globals.css`:

```css
/* === MOBILE RESPONSIVE === */

@media (max-width: 480px) {
  /* Full-width terminal window on mobile */
  .terminal-window {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  /* Larger touch targets */
  .btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.625rem 1rem;
  }

  /* Share buttons stack */
  .share-stack {
    flex-direction: column;
  }
  .share-stack > button {
    width: 100%;
  }
}

@media (max-width: 768px) {
  /* Ensure text is readable */
  .prompt-input {
    font-size: 16px; /* prevents iOS zoom on focus */
  }

  /* Messages slightly more compact */
  .msg-player, .msg-buyer {
    padding-left: 10px;
  }
}
```

- [ ] **Step 2: Update ShareButtons to use the share-stack class**

In `src/app/r/[shareId]/ShareButtons.tsx`, on the wrapper div for buttons (the one with `display: "flex", flexWrap: "wrap"`), add `className="share-stack"`:

```tsx
<div className="share-stack" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/r/\[shareId\]/ShareButtons.tsx
git commit -m "feat: mobile responsive styles and touch-friendly targets"
```

---

### Task 9: Update Duel Page to Use Suspense for searchParams

**Files:**
- Modify: `src/app/duel/page.tsx`

**Interfaces:**
- Consumes: `DuelClient` component
- Produces: Properly wrapped client component with Suspense boundary (Next.js 14 requires this for `useSearchParams`)

- [ ] **Step 1: Update duel page.tsx**

Replace `src/app/duel/page.tsx` with:

```tsx
import { Suspense } from "react";
import DuelClient from "./DuelClient";

export const runtime = "nodejs";

export default function DuelPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "var(--text-secondary)" }}>loading...</div>}>
      <DuelClient />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no warnings about missing Suspense boundary.

- [ ] **Step 3: Commit**

```bash
git add src/app/duel/page.tsx
git commit -m "feat: wrap DuelClient in Suspense for searchParams"
```

---

### Task 10: Final Integration Verification

**Files:** None (verification only)

**Interfaces:**
- Consumes: All prior tasks
- Produces: Verified working build

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No lint errors (warnings acceptable).

- [ ] **Step 4: Start dev server and smoke test**

```bash
npm run dev
```

Manual checks:
1. Homepage loads with 5 scenario cards
2. Clicking a card navigates to `/duel?scenario=skeptical-vp` (etc.) and starts the timer
3. Timer counts down from 7:00
4. Sending a message gets a buyer reply + `vague` field in network response
5. No mic button visible
6. On mobile viewport (375px), layout is usable — input at bottom, cards stack
7. At 30s remaining, warning appears
8. Share buttons work on scorecard page

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration fixes from smoke test"
```
