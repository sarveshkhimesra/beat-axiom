# Beat AXIOM v2 — Dynamic Conversation Engine + Stage Unlocks

**Date:** 2026-06-21
**Status:** Approved
**Branch:** `dev/v2`

---

## 1. Overview

Transform Beat AXIOM from a fixed 7-question duel into a **dynamic, stage-based sales simulation** where the AI silently controls pacing, the buyer's impatience creates natural time pressure, and progression through sales stages (Discovery → Pitch → Negotiate → Close) is earned through quality, not clicks.

**Key decisions:**
- **Stage transitions:** AI decides silently (buyer behavior shifts when player earns it)
- **Timing:** Soft impatience — no visible timer; buyer degrades if player is slow/vague
- **Game over:** Natural close OR soft max ~20 turns (buyer wraps it up)
- **Scenarios:** Hybrid — 8 curated templates + AI-generated surface variation
- **Identity:** Lightweight — username + localStorage game history
- **Architecture:** Approach A — evolve the current stateless turn-based engine (designed for future migration to server-managed state machine)

---

## 2. The Game Loop

```
[Onboarding] → [Scenario Selection] → [Brief] → [Conversation] → [Verdict] → [Share/History]
```

### Onboarding
- First-time: ask for a display name (stored in localStorage). No auth.
- Returning: greet by name, show past games (count + last score/title).
- Skip straight to scenario selection after greeting.

### Scenario Selection
- Show available templates as cards (title, archetype description, difficulty tier 1–3).
- Optional filters: industry, difficulty. AI generates surface variation at start time.

### Brief
- Full-screen pre-game brief: buyer context, your product edge + weakness, what you're walking into.
- Player reads, hits "Enter meeting" to start.
- During game: 📋 icon opens brief as a slide-over overlay. Always accessible.

### Conversation (the core)
- No turn limit displayed. No visible timer.
- Player sends messages (text or voice). Buyer responds.
- Each turn: evaluated for stage readiness + impatience.
- Stage unlocks shown as a subtle notification in the conversation log.
- AXIOM hook lines provide stage-contextual feedback between turns.
- Game ends when: (a) player earns Close and closes, (b) buyer's impatience hits 1.0 (walks away), or (c) soft max ~20 turns reached (buyer wraps up naturally).

### Verdict
- AXIOM scores per-stage (see Section 5).
- Overall score normalized to 0–100.
- Roast references specific stage performance.
- Scorecard image + share flow (same as v1).

### History
- localStorage stores: `{ username, games: [{ templateId, score, title, date, shareId }] }`
- Shown on return: last game, total count.

---

## 3. Stage Mechanics

### The 4 Stages

| Stage | Buyer behavior | Unlock criteria |
|---|---|---|
| **Discovery** | Warm, open, shares surface pains. Guards hidden priority. | Player uncovers ≥2 specific pains AND asks about impact/stakeholders |
| **Pitch** | Evaluative, probes weaknesses, compares alternatives. | Player articulates value proposition tied to discovered pains |
| **Negotiate** | Harder, pushes back on price/terms, raises objections. | Player addresses the main objection AND proposes a deal structure |
| **Close** | Decision-mode. Wants commitment, timeline, next steps. | Player asks for commitment or proposes clear next step |

### Stage Evaluation

Baked into the buyer's system prompt. After each response, the AI returns structured metadata:

```json
{
  "currentStage": "discovery",
  "stageJustUnlocked": null,
  "impatienceLevel": 0.2,
  "turnsInCurrentStage": 3,
  "gameOver": false,
  "gameOverReason": null,
  "hookLine": "sharp — keep pulling that thread."
}
```

This metadata is parsed from the AI response (structured suffix, separated from the conversational text) and used by the client to update UI state.

### Stage Transition Rules
- Transitions only move forward (Discovery → Pitch → Negotiate → Close). No going back.
- A player CAN still ask discovery-style questions during Pitch — but the buyer is now in Pitch mode (evaluative, not volunteering information). The stage unlocked doesn't limit what you say; it changes how the buyer responds.
- If a player is in Discovery and attempts to close: buyer deflects ("Let's not get ahead of ourselves. I still need to understand what you're actually offering.") and impatience increases.

---

## 4. Impatience System

### Triggers (increase impatience)

| Trigger | Increase | Rationale |
|---|---|---|
| Wall-clock time since last message > 90s | +0.15 per 90s block | Losing the room |
| Generic/vague question | +0.10 per occurrence | Wasting buyer's time |
| Repeating a question already answered | +0.15 | Not listening |
| >6 turns in one stage without unlocking next | +0.08 per turn past 6 | Meandering |
| Pitching before Discovery unlocked | +0.20 (one-time) | Premature |

### Triggers (decrease impatience)

| Trigger | Decrease |
|---|---|
| Sharp, well-targeted question | -0.05 |
| Stage unlocked (proves progress) | -0.10 |
| Acknowledging buyer's time + pivoting | -0.05 |

### Behavior at Thresholds

| Impatience | Buyer behavior |
|---|---|
| 0.0–0.3 | Normal — warm, engaged, full answers |
| 0.3–0.5 | Slightly shorter answers. "I want to be respectful of time." |
| 0.5–0.7 | Curt. "I have another meeting at 3." 1–2 sentence answers. Stops volunteering. |
| 0.7–0.9 | "I think you've got what you need. Send me something." (Attempting to end.) |
| 1.0 | "I appreciate your time but I need to jump." **Game over.** |

### Implementation
- Impatience float is part of the game state passed to each API call.
- The buyer's system prompt includes the current impatience level and behavior instructions per threshold.
- Wall-clock timing tracked client-side (time between user sends).
- Generic-question detection + repeat detection are handled by the AI itself (it has the full transcript in context and is instructed to flag these in its metadata response).

---

## 5. Scoring (Enhanced AXIOM Verdict)

### Per-Stage Rubric

| Stage | Dimensions | Points |
|---|---|---|
| **Discovery** | Pain depth (15), Stakeholder mapping (10), Impact quantification (10), Hidden priority progress (15) | 50 |
| **Pitch** | Tailoring to discovery (15), Weakness handling (10), Value quantification (10), Differentiation (10) | 45 |
| **Negotiate** | Objection handling (15), Concession trading (10), Deal structure (10), Margin discipline (10) | 45 |
| **Close** | Clear ask (10), Urgency framing (10), Handling final hesitation (10), Next steps (10) | 40 |

**Total raw: 180 → normalized to 0–100.**

### Modifiers

| Modifier | Effect |
|---|---|
| Stage efficiency (all 4 stages in ≤12 turns) | +10 |
| Hidden priority fully cracked | +10 |
| Buyer walked away (impatience = 1.0) | Score capped at 40 max |
| Generic questions | -3 each |
| Pitching before Discovery unlocked | -15 |

### Title Bands

| Score | Title |
|---|---|
| 90–100 | Closer |
| 75–89 | Operator |
| 60–74 | Contender |
| 45–59 | Happy Ears |
| 30–44 | The Brochure |
| 0–29 | Meeting Cancelled |

### Verdict Output

```json
{
  "score": 74,
  "title": "Contender",
  "stageScores": {
    "discovery": { "painDepth": 12, "stakeholders": 8, "impact": 7, "hiddenPriority": 10 },
    "pitch": { "tailoring": 11, "weakness": 7, "value": 6, "differentiation": 8 },
    "negotiate": { "objection": 12, "concessions": 6, "structure": 7, "margin": 8 },
    "close": { "ask": 7, "urgency": 5, "hesitation": 6, "nextSteps": 8 }
  },
  "modifiers": { "efficiency": 0, "hiddenPriority": 10, "walkaway": false, "genericPenalty": -6, "prematurePitch": 0 },
  "bestLine": "...",
  "worstLine": "...",
  "roast": "...",
  "stagesSummary": "Discovery (4 turns) → Pitch (5 turns) → Negotiate (6 turns) → Close (3 turns)",
  "didDetectSignal": true,
  "buyerWalkedAway": false
}
```

---

## 6. Scenario Templates

### Structure

```typescript
interface ScenarioTemplate {
  id: string;
  archetype: string;           // "The Budget Blocker"
  title: string;               // display name
  description: string;         // 1-line for the selection card
  difficulty: 1 | 2 | 3;
  buyerRole: string;
  personality: string;
  hiddenPriority: string;
  hiddenPriorityHintTopics: string[];
  signatureObjection: string;
  stageUnlockCriteria: Record<Stage, string>;
  impatienceConfig: {
    baseRate: number;          // difficulty-scaled starting impatience growth
    genericQuestionPenalty: number;
  };
  variationPrompt: string;    // instructions for the AI variation generator
}
```

### The 8 Templates (v2 launch)

1. **The Skeptical VP** (Difficulty 1) — burned by past rollout, needs a visible win
2. **The Cost-Cutting CFO** (Difficulty 2) — talks cost, secretly wants innovation story
3. **The Committee Gatekeeper** (Difficulty 2) — process-driven, hides the real sponsor
4. **The Technical Blocker** (Difficulty 2) — CTO who evaluates on infra, not business
5. **The Champion With No Power** (Difficulty 2) — loves you, can't sign
6. **The Incumbent Defender** (Difficulty 3) — happy with current vendor, you're the challenger
7. **The Speed Buyer** (Difficulty 1) — wants it yesterday, tests urgency matching
8. **The Multi-Stakeholder Maze** (Difficulty 3) — references others you'll need to convince

### AI Variation

At game start, `/api/duel/start` takes the template + optional filters and calls the AI to generate:
- Company name + backstory (1 paragraph)
- Specific pain-point numbers
- Budget signals (industry-appropriate)
- Buyer's name + personal details
- Surface detail for the product being sold

Fixed from template (never varied): hidden priority, unlock criteria, objection, personality core, difficulty config.

---

## 7. UI Changes

### Conversation Screen

- **Stage indicator:** muted text in top-left of conversation area. Updates silently on unlock.
- **Stage unlock notification:** single line in the conversation log ("── stage unlocked: pitch ──"). Accent-colored, non-blocking.
- **No turn counter.** Removed entirely.
- **AXIOM hook lines:** stage-contextual ("sharp — 4 turns to unlock pitch" / "buyer's getting impatient" / "you're in the close — ask for it").
- **Brief overlay:** 📋 icon in header, slides in from right. Always accessible.
- **Impatience color:** buyer's name label shifts green → amber → red. No explicit bar.
- **"Face AXIOM" button:** removed. Game ends naturally (close success or buyer walkaway or soft max). Verdict triggers automatically.

### Onboarding

- First-time: terminal-style "what should I call you?" → name input → straight to scenarios.
- Returning: "welcome back, [name]" + last game summary → scenarios.

### Scenario Selection

- Cards in a grid. Each shows: title, archetype description, difficulty dots (●●○ = tier 2).
- Optional filter chips above: industry, difficulty level.

---

## 8. Technical Architecture

### What stays unchanged
- Next.js 14 App Router
- `src/lib/anthropic.ts` (multi-provider client)
- `@vercel/og` for scorecard images
- Upstash Redis for completed game persistence
- Terminal aesthetic / globals.css
- Share buttons + LinkedIn/X flow
- AxiomAvatar component
- Sound effects (sfx.ts)
- Voice input (useSpeech.ts)

### File changes

| Current file | Action | New file |
|---|---|---|
| `src/lib/duel/scenarios.ts` | Replace | `src/lib/duel/templates.ts` (8 templates) |
| — | Create | `src/lib/duel/variator.ts` (AI variation generator) |
| — | Create | `src/lib/duel/stages.ts` (stage definitions + unlock criteria) |
| — | Create | `src/lib/duel/evaluator.ts` (stage readiness + impatience logic) |
| — | Create | `src/lib/duel/player.ts` (localStorage identity + history) |
| `src/lib/duel/avatarPrompt.ts` | Rewrite | `src/lib/duel/buyerPrompt.ts` (stage-aware + impatience-aware) |
| `src/lib/duel/axiomPrompt.ts` | Rewrite | `src/lib/duel/verdictPrompt.ts` (per-stage scoring) |
| `src/lib/duel/rubric.ts` | Rewrite | `src/lib/duel/scoring.ts` (per-stage rubric + normalization) |
| `src/lib/duel/config.ts` | Update | Add SOFT_MAX_TURNS, impatience thresholds, remove MAX_PLAYER_TURNS |
| `src/app/api/duel/avatar/route.ts` | Replace | `src/app/api/duel/turn/route.ts` (richer response with metadata) |
| — | Create | `src/app/api/duel/start/route.ts` (template + variation → scenario) |
| `src/app/duel/DuelClient.tsx` | Rewrite | Stage indicator, impatience color, no turn counter, auto-end |
| `src/app/page.tsx` | Rewrite | Onboarding + returning player + scenario selection |
| `src/lib/duel/shareText.ts` | Update | Reference stage performance in share copy |

### API Flow

**Game start:**
```
POST /api/duel/start { templateId, filters? }
→ AI generates variation
→ Returns { scenarioId, scenario (full generated data), brief (player-facing) }
```

**Each turn:**
```
POST /api/duel/turn { scenarioId, message, history, currentStage, impatienceLevel, turnTimestamp }
→ Build stage-aware buyer prompt (includes impatience instructions + metadata request)
→ Call AI → parse response (conversational text + structured metadata suffix)
→ Return { buyerMessage, currentStage, stageJustUnlocked, impatienceLevel, gameOver, gameOverReason, hookLine }
```

**Verdict (triggered when gameOver=true):**
```
POST /api/duel/verdict { scenarioId, history, stagesReached, templateId }
→ Same as v1 but with per-stage rubric
→ Returns { session (with enhanced verdict) }
```

### Metadata in AI Response

The buyer's system prompt instructs it to append a JSON block after its conversational response, separated by a delimiter:

```
<conversational response (what the player sees)>

---AXIOM_META---
{"currentStage":"discovery","stageJustUnlocked":null,"impatienceLevel":0.25,"gameOver":false,"hookLine":"keep digging."}
```

The API route parses this: everything before the delimiter is the buyer message; the JSON after is the game state update. If the delimiter is missing (model didn't follow instructions), fall back to conservative defaults (no stage change, slight impatience increase).

---

## 9. Migration from v1

- The v1 viral scorecard pages (`/r/[shareId]`) continue working — existing Redis sessions are read-only, unaffected.
- The v1 OG image route works unchanged for old sessions.
- The v1 share URLs remain valid forever.
- New games use the v2 engine; old scorecards just show v1-style scores.
- The 3 existing scenarios become templates 1–3 (with their existing hidden priorities + objections), gaining stage mechanics on top.

---

## 10. What's NOT in v2 (deferred)

- Leaderboard (needs server-side profiles → v3)
- Adaptive difficulty based on past performance (needs profile history → v3)
- Full auth / accounts (v3)
- Enterprise mode / org-level tracking (v4)
- Chess-style skill inference from calibration games (v4)
- Custom scenario builder / company-specific training (v4)
- Multiplayer / challenge-a-colleague (v3)
