# Beat AXIOM v2 — Dynamic Stages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 7-question duel with a dynamic, stage-based sales simulation — 4 stages (Discovery → Pitch → Negotiate → Close), AI-driven stage transitions, soft impatience system, hybrid scenarios, and lightweight player identity.

**Architecture:** Evolve the current stateless turn-based engine (Approach A). Each turn still POSTs to an API route with the full history. The buyer's system prompt now includes stage-awareness + impatience instructions, and the AI returns structured metadata alongside its response (parsed via a delimiter). Stage evaluation, impatience tracking, and game-over detection happen inside the same AI call.

**Tech Stack:** Next.js 14, TypeScript, Anthropic Claude (via multi-provider client), Upstash Redis, @vercel/og, vitest, Tailwind CSS.

**Branch:** `dev/v2`

**Reference:** Design spec at `docs/superpowers/specs/2026-06-21-v2-dynamic-stages-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/duel/types.ts` | **Rewrite** — v2 types: Stage, Template, GeneratedScenario, TurnMetadata, V2Verdict, GameState |
| `src/lib/duel/stages.ts` | **Create** — stage definitions, unlock criteria text, impatience thresholds |
| `src/lib/duel/templates.ts` | **Create** — 8 curated scenario templates (replaces scenarios.ts) |
| `src/lib/duel/variator.ts` | **Create** — AI call to generate surface variation from a template + filters |
| `src/lib/duel/buyerPrompt.ts` | **Create** — stage-aware + impatience-aware buyer system prompt builder |
| `src/lib/duel/verdictPrompt.ts` | **Create** — per-stage AXIOM verdict prompt (replaces axiomPrompt.ts) |
| `src/lib/duel/scoring.ts` | **Create** — per-stage rubric, normalization, title bands, verdict parser |
| `src/lib/duel/parseMeta.ts` | **Create** — parse the `---AXIOM_META---` delimiter from AI responses |
| `src/lib/duel/player.ts` | **Create** — localStorage read/write for username + game history |
| `src/lib/duel/config.ts` | **Update** — SOFT_MAX_TURNS=20, remove MAX_PLAYER_TURNS=7, impatience config |
| `src/app/api/duel/start/route.ts` | **Create** — takes templateId + filters, runs variator, returns scenario + brief |
| `src/app/api/duel/turn/route.ts` | **Create** — replaces /api/duel/avatar; returns buyerMessage + metadata |
| `src/app/api/duel/verdict/route.ts` | **Rewrite** — per-stage scoring |
| `src/app/duel/DuelClient.tsx` | **Rewrite** — stage indicator, impatience color, no turn counter, auto-end |
| `src/app/page.tsx` | **Rewrite** — onboarding + returning player + scenario selection |
| `src/lib/duel/shareText.ts` | **Update** — reference stage performance |
| `src/lib/duel/store.ts` | **Update** — accept V2Verdict shape |

---

## Task 1: v2 Types

**Files:**
- Rewrite: `src/lib/duel/types.ts`

- [ ] **Step 1: Write the new types file**

```ts
// src/lib/duel/types.ts — v2 domain types

export type Stage = "discovery" | "pitch" | "negotiate" | "close";
export const STAGES: Stage[] = ["discovery", "pitch", "negotiate", "close"];

export type TemplateId =
  | "skeptical-vp"
  | "cost-cutting-cfo"
  | "committee-gatekeeper"
  | "technical-blocker"
  | "champion-no-power"
  | "incumbent-defender"
  | "speed-buyer"
  | "multi-stakeholder";

export interface ScenarioTemplate {
  id: TemplateId;
  archetype: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  buyerRole: string;
  personality: string;
  hiddenPriority: string;
  hiddenPriorityHintTopics: string[];
  signatureObjection: string;
  stageUnlockCriteria: Record<Stage, string>;
  impatienceConfig: { baseRate: number; genericQuestionPenalty: number };
  variationPrompt: string;
}

export interface GeneratedScenario {
  templateId: TemplateId;
  title: string;
  companyName: string;
  backstory: string;
  buyerName: string;
  buyerRole: string;
  personality: string;
  product: string;
  sellerStrength: string;
  sellerWeakness: string;
  surfacePains: string[];
  hiddenPriority: string;
  hiddenPriorityHintTopics: string[];
  signatureObjection: string;
  budgetSignal: string;
  stageUnlockCriteria: Record<Stage, string>;
  impatienceConfig: { baseRate: number; genericQuestionPenalty: number };
  brief: string; // player-facing brief text
}

export interface DuelMessage {
  role: "player" | "buyer";
  content: string;
  at: number;
}

export interface TurnMetadata {
  currentStage: Stage;
  stageJustUnlocked: Stage | null;
  impatienceLevel: number;
  gameOver: boolean;
  gameOverReason: "closed" | "walkaway" | "soft-max" | null;
  hookLine: string;
}

export interface StageScores {
  discovery: Record<string, number>;
  pitch: Record<string, number>;
  negotiate: Record<string, number>;
  close: Record<string, number>;
}

export interface V2Verdict {
  score: number;
  title: string;
  stageScores: StageScores;
  modifiers: {
    efficiency: number;
    hiddenPriority: number;
    walkaway: boolean;
    genericPenalty: number;
    prematurePitch: number;
  };
  bestLine: string;
  worstLine: string;
  roast: string;
  stagesSummary: string;
  didDetectSignal: boolean;
  buyerWalkedAway: boolean;
}

export interface DuelSession {
  shareId: string;
  templateId: TemplateId;
  scenarioTitle: string;
  verdict: V2Verdict;
  percentile: number;
  createdAt: number;
}

export interface PlayerProfile {
  username: string;
  games: Array<{
    templateId: TemplateId;
    score: number;
    title: string;
    date: number;
    shareId: string;
  }>;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors from this file (other files will break — they import old types; fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/lib/duel/types.ts
git commit -m "feat(v2): rewrite domain types for stage-based engine"
```

---

## Task 2: Stages + Config

**Files:**
- Create: `src/lib/duel/stages.ts`
- Modify: `src/lib/duel/config.ts`

- [ ] **Step 1: Write stages.ts**

```ts
// src/lib/duel/stages.ts
import { Stage } from "./types";

export interface StageDefinition {
  id: Stage;
  label: string;
  buyerMode: string;
  unlockDescription: string;
}

export const STAGE_DEFINITIONS: Record<Stage, StageDefinition> = {
  discovery: {
    id: "discovery",
    label: "Discovery",
    buyerMode: "Warm, open, shares surface pains. Guards hidden priority.",
    unlockDescription: "Player uncovers ≥2 specific pains AND asks about impact or stakeholders.",
  },
  pitch: {
    id: "pitch",
    label: "Pitch",
    buyerMode: "Evaluative, probes weaknesses, compares to alternatives.",
    unlockDescription: "Player articulates value proposition tied to discovered pains.",
  },
  negotiate: {
    id: "negotiate",
    label: "Negotiate",
    buyerMode: "Harder, pushes back on price/terms, raises objections.",
    unlockDescription: "Player addresses the main objection AND proposes a deal structure.",
  },
  close: {
    id: "close",
    label: "Close",
    buyerMode: "Decision-mode. Wants commitment, timeline, next steps.",
    unlockDescription: "Player asks for commitment or proposes a clear next step.",
  },
};

export function nextStage(current: Stage): Stage | null {
  const idx = ["discovery", "pitch", "negotiate", "close"].indexOf(current);
  if (idx < 3) return ["discovery", "pitch", "negotiate", "close"][idx + 1] as Stage;
  return null;
}

export const IMPATIENCE_THRESHOLDS = {
  hinting: 0.3,
  curt: 0.5,
  wrapping: 0.7,
  walkaway: 1.0,
} as const;
```

- [ ] **Step 2: Update config.ts**

Replace `src/lib/duel/config.ts` with:

```ts
// src/lib/duel/config.ts — client-safe constants

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? DEFAULT_MODEL;
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? DEFAULT_MODEL;
export const VARIATOR_MODEL = process.env.DUEL_VARIATOR_MODEL ?? DEFAULT_MODEL;

/** Soft max turns — buyer wraps up naturally after this. */
export const SOFT_MAX_TURNS = 20;
/** Impatience increase when player is silent > 90s. */
export const SILENCE_IMPATIENCE = 0.15;
/** Turns in one stage before impatience ticks up. */
export const STAGE_STALL_THRESHOLD = 6;
/** Impatience per turn past the stall threshold. */
export const STALL_IMPATIENCE = 0.08;

export const RAHUL_MENTION = "@Rahul Kothari";
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";

/** The delimiter the buyer prompt uses to separate conversation from metadata. */
export const META_DELIMITER = "---AXIOM_META---";
```

- [ ] **Step 3: Verify stages.ts compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/stages.ts src/lib/duel/config.ts
git commit -m "feat(v2): add stage definitions + update config for dynamic engine"
```

---

## Task 3: Metadata Parser

**Files:**
- Create: `src/lib/duel/parseMeta.ts`
- Test: `src/lib/duel/parseMeta.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/duel/parseMeta.test.ts
import { describe, it, expect } from "vitest";
import { parseResponse } from "./parseMeta";

describe("parseResponse", () => {
  it("splits conversational text from metadata", () => {
    const raw = `That's a great question. Let me think about it.\n\n---AXIOM_META---\n{"currentStage":"discovery","stageJustUnlocked":null,"impatienceLevel":0.1,"gameOver":false,"gameOverReason":null,"hookLine":"keep digging."}`;
    const { message, meta } = parseResponse(raw);
    expect(message).toBe("That's a great question. Let me think about it.");
    expect(meta.currentStage).toBe("discovery");
    expect(meta.impatienceLevel).toBe(0.1);
    expect(meta.gameOver).toBe(false);
    expect(meta.hookLine).toBe("keep digging.");
  });

  it("handles missing delimiter gracefully (fallback defaults)", () => {
    const raw = "Just a normal response with no metadata.";
    const { message, meta } = parseResponse(raw);
    expect(message).toBe("Just a normal response with no metadata.");
    expect(meta.currentStage).toBe("discovery");
    expect(meta.stageJustUnlocked).toBeNull();
    expect(meta.impatienceLevel).toBe(0.05);
    expect(meta.gameOver).toBe(false);
  });

  it("handles stage unlock", () => {
    const raw = `Interesting. Tell me more about your solution.\n\n---AXIOM_META---\n{"currentStage":"pitch","stageJustUnlocked":"pitch","impatienceLevel":0.15,"gameOver":false,"gameOverReason":null,"hookLine":"stage unlocked — show them what you've got."}`;
    const { meta } = parseResponse(raw);
    expect(meta.currentStage).toBe("pitch");
    expect(meta.stageJustUnlocked).toBe("pitch");
  });

  it("handles game over (walkaway)", () => {
    const raw = `I need to jump. Thanks for your time.\n\n---AXIOM_META---\n{"currentStage":"discovery","stageJustUnlocked":null,"impatienceLevel":1.0,"gameOver":true,"gameOverReason":"walkaway","hookLine":"buyer walked away."}`;
    const { meta } = parseResponse(raw);
    expect(meta.gameOver).toBe(true);
    expect(meta.gameOverReason).toBe("walkaway");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/parseMeta.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/duel/parseMeta.ts
import { TurnMetadata, Stage } from "./types";
import { META_DELIMITER } from "./config";

const DEFAULT_META: TurnMetadata = {
  currentStage: "discovery",
  stageJustUnlocked: null,
  impatienceLevel: 0.05,
  gameOver: false,
  gameOverReason: null,
  hookLine: "",
};

export function parseResponse(raw: string): { message: string; meta: TurnMetadata } {
  const delimIdx = raw.indexOf(META_DELIMITER);
  if (delimIdx === -1) {
    return { message: raw.trim(), meta: { ...DEFAULT_META } };
  }
  const message = raw.slice(0, delimIdx).trim();
  const jsonStr = raw.slice(delimIdx + META_DELIMITER.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as Partial<TurnMetadata>;
    const meta: TurnMetadata = {
      currentStage: (parsed.currentStage as Stage) ?? "discovery",
      stageJustUnlocked: (parsed.stageJustUnlocked as Stage | null) ?? null,
      impatienceLevel: typeof parsed.impatienceLevel === "number" ? parsed.impatienceLevel : 0.05,
      gameOver: parsed.gameOver === true,
      gameOverReason: parsed.gameOverReason ?? null,
      hookLine: typeof parsed.hookLine === "string" ? parsed.hookLine : "",
    };
    return { message, meta };
  } catch {
    return { message: raw.trim(), meta: { ...DEFAULT_META } };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/parseMeta.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/parseMeta.ts src/lib/duel/parseMeta.test.ts
git commit -m "feat(v2): add metadata parser for AI response delimiter"
```

---

## Task 4: Per-Stage Scoring + Verdict Parser

**Files:**
- Create: `src/lib/duel/scoring.ts`
- Test: `src/lib/duel/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/duel/scoring.test.ts
import { describe, it, expect } from "vitest";
import { STAGE_RUBRIC, TOTAL_RAW, normalizeScore, titleForScore, parseV2Verdict } from "./scoring";

describe("scoring", () => {
  it("raw points total 180", () => {
    let total = 0;
    for (const stage of Object.values(STAGE_RUBRIC)) {
      total += stage.reduce((a, d) => a + d.maxPoints, 0);
    }
    expect(total).toBe(180);
    expect(TOTAL_RAW).toBe(180);
  });

  it("normalizeScore maps 180 → 100 and 0 → 0", () => {
    expect(normalizeScore(180)).toBe(100);
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(90)).toBe(50);
  });

  it("titleForScore maps bands", () => {
    expect(titleForScore(95)).toBe("Closer");
    expect(titleForScore(30)).toBe("The Brochure");
    expect(titleForScore(10)).toBe("Meeting Cancelled");
  });
});

describe("parseV2Verdict", () => {
  const validJson = JSON.stringify({
    score: 74,
    title: "Contender",
    stageScores: {
      discovery: { painDepth: 12, stakeholders: 8, impact: 7, hiddenPriority: 10 },
      pitch: { tailoring: 11, weakness: 7, value: 6, differentiation: 8 },
      negotiate: { objection: 12, concessions: 6, structure: 7, margin: 8 },
      close: { ask: 7, urgency: 5, hesitation: 6, nextSteps: 8 },
    },
    modifiers: { efficiency: 0, hiddenPriority: 10, walkaway: false, genericPenalty: -6, prematurePitch: 0 },
    bestLine: "Great line here",
    worstLine: "Bad line here",
    roast: "A solid roast.",
    stagesSummary: "Discovery (4) → Pitch (5) → Negotiate (6) → Close (3)",
    didDetectSignal: true,
    buyerWalkedAway: false,
  });

  it("parses valid JSON", () => {
    const v = parseV2Verdict(validJson);
    expect(v.score).toBe(74);
    expect(v.stageScores.discovery.painDepth).toBe(12);
    expect(v.modifiers.hiddenPriority).toBe(10);
  });

  it("extracts JSON from prose wrapping", () => {
    const v = parseV2Verdict("Here:\n```json\n" + validJson + "\n```");
    expect(v.title).toBe("Contender");
  });

  it("clamps score to 0-100", () => {
    const v = parseV2Verdict(validJson.replace('"score": 74', '"score": 999'));
    expect(v.score).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/scoring.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/duel/scoring.ts
import { Stage, V2Verdict, StageScores } from "./types";

export interface RubricDimension {
  key: string;
  label: string;
  maxPoints: number;
}

export const STAGE_RUBRIC: Record<Stage, RubricDimension[]> = {
  discovery: [
    { key: "painDepth", label: "Pain depth", maxPoints: 15 },
    { key: "stakeholders", label: "Stakeholder mapping", maxPoints: 10 },
    { key: "impact", label: "Impact quantification", maxPoints: 10 },
    { key: "hiddenPriority", label: "Hidden priority progress", maxPoints: 15 },
  ],
  pitch: [
    { key: "tailoring", label: "Tailoring to discovery", maxPoints: 15 },
    { key: "weakness", label: "Weakness handling", maxPoints: 10 },
    { key: "value", label: "Value quantification", maxPoints: 10 },
    { key: "differentiation", label: "Differentiation", maxPoints: 10 },
  ],
  negotiate: [
    { key: "objection", label: "Objection handling", maxPoints: 15 },
    { key: "concessions", label: "Concession trading", maxPoints: 10 },
    { key: "structure", label: "Deal structure", maxPoints: 10 },
    { key: "margin", label: "Margin discipline", maxPoints: 10 },
  ],
  close: [
    { key: "ask", label: "Clear ask", maxPoints: 10 },
    { key: "urgency", label: "Urgency framing", maxPoints: 10 },
    { key: "hesitation", label: "Handling final hesitation", maxPoints: 10 },
    { key: "nextSteps", label: "Next steps", maxPoints: 10 },
  ],
};

export const TOTAL_RAW = Object.values(STAGE_RUBRIC)
  .flat()
  .reduce((a, d) => a + d.maxPoints, 0); // 180

export function normalizeScore(raw: number): number {
  return Math.round(Math.max(0, Math.min(100, (raw / TOTAL_RAW) * 100)));
}

interface TitleBand { min: number; title: string }
const TITLE_BANDS: TitleBand[] = [
  { min: 90, title: "Closer" },
  { min: 75, title: "Operator" },
  { min: 60, title: "Contender" },
  { min: 45, title: "Happy Ears" },
  { min: 30, title: "The Brochure" },
  { min: 0, title: "Meeting Cancelled" },
];

export function titleForScore(score: number): string {
  return TITLE_BANDS.find((b) => score >= b.min)!.title;
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("no JSON in verdict");
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") { depth--; if (depth === 0) return raw.slice(start, i + 1); }
  }
  throw new Error("unbalanced JSON in verdict");
}

function clamp(n: unknown, lo: number, hi: number): number {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

export function parseV2Verdict(raw: string): V2Verdict {
  const obj = JSON.parse(extractJsonObject(raw));
  const score = clamp(obj.score, 0, 100);
  const ss = obj.stageScores ?? {};
  const stageScores: StageScores = {
    discovery: ss.discovery ?? {},
    pitch: ss.pitch ?? {},
    negotiate: ss.negotiate ?? {},
    close: ss.close ?? {},
  };
  const m = obj.modifiers ?? {};
  return {
    score,
    title: (obj.title && String(obj.title).trim()) || titleForScore(score),
    stageScores,
    modifiers: {
      efficiency: typeof m.efficiency === "number" ? m.efficiency : 0,
      hiddenPriority: typeof m.hiddenPriority === "number" ? m.hiddenPriority : 0,
      walkaway: m.walkaway === true,
      genericPenalty: typeof m.genericPenalty === "number" ? m.genericPenalty : 0,
      prematurePitch: typeof m.prematurePitch === "number" ? m.prematurePitch : 0,
    },
    bestLine: String(obj.bestLine ?? "").trim(),
    worstLine: String(obj.worstLine ?? "").trim(),
    roast: String(obj.roast ?? "").trim(),
    stagesSummary: String(obj.stagesSummary ?? "").trim(),
    didDetectSignal: obj.didDetectSignal === true,
    buyerWalkedAway: obj.buyerWalkedAway === true,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/scoring.ts src/lib/duel/scoring.test.ts
git commit -m "feat(v2): add per-stage scoring rubric + verdict parser"
```

---

*Plan continues in next append — Tasks 5-15 cover templates, buyer prompt, variator, verdict prompt, player module, API routes, and UI rewrite.*

---

## Task 5: Scenario Templates (8 curated)

**Files:**
- Create: `src/lib/duel/templates.ts`
- Test: `src/lib/duel/templates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/duel/templates.test.ts
import { describe, it, expect } from "vitest";
import { TEMPLATES, TEMPLATE_IDS, getTemplate } from "./templates";

describe("templates", () => {
  it("has exactly 8 templates", () => {
    expect(TEMPLATE_IDS).toHaveLength(8);
  });

  it("every template has required fields", () => {
    for (const id of TEMPLATE_IDS) {
      const t = TEMPLATES[id];
      expect(t.id).toBe(id);
      expect(t.hiddenPriority.length).toBeGreaterThan(10);
      expect(t.signatureObjection.length).toBeGreaterThan(10);
      expect(t.hiddenPriorityHintTopics.length).toBeGreaterThanOrEqual(3);
      expect(t.stageUnlockCriteria.discovery).toBeDefined();
      expect(t.stageUnlockCriteria.pitch).toBeDefined();
      expect(t.stageUnlockCriteria.negotiate).toBeDefined();
      expect(t.stageUnlockCriteria.close).toBeDefined();
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(3);
    }
  });

  it("getTemplate throws on unknown id", () => {
    expect(() => getTemplate("nonexistent" as any)).toThrow();
  });

  it("templates are domain-neutral", () => {
    const blob = JSON.stringify(TEMPLATES).toLowerCase();
    for (const term of ["razorpay", "novabrand", "upi", "bnpl"]) {
      expect(blob).not.toContain(term);
    }
  });
});
```

- [ ] **Step 2: Write templates.ts**

Create `src/lib/duel/templates.ts` with all 8 templates. Each template includes: id, archetype, title, description, difficulty (1-3), buyerRole, personality, hiddenPriority, hiddenPriorityHintTopics, signatureObjection, stageUnlockCriteria (one string per stage describing what the AI should evaluate), impatienceConfig, and variationPrompt.

The 8 templates:
1. skeptical-vp (difficulty 1) — burned by past rollout, needs a visible win
2. cost-cutting-cfo (difficulty 2) — talks cost, secretly wants innovation story
3. committee-gatekeeper (difficulty 2) — process-driven, hides the real sponsor
4. technical-blocker (difficulty 2) — CTO evaluates on infra not business
5. champion-no-power (difficulty 2) — loves you but can't sign
6. incumbent-defender (difficulty 3) — happy with current vendor
7. speed-buyer (difficulty 1) — wants it yesterday
8. multi-stakeholder (difficulty 3) — references others you'll need to convince

Export: `TEMPLATES` (Record<TemplateId, ScenarioTemplate>), `TEMPLATE_IDS` (TemplateId[]), `getTemplate(id)`.

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/templates.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/templates.ts src/lib/duel/templates.test.ts
git commit -m "feat(v2): add 8 curated scenario templates"
```

---

## Task 6: Buyer Prompt (stage-aware + impatience)

**Files:**
- Create: `src/lib/duel/buyerPrompt.ts`
- Test: `src/lib/duel/buyerPrompt.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/duel/buyerPrompt.test.ts
import { describe, it, expect } from "vitest";
import { buildBuyerPrompt } from "./buyerPrompt";
import { Stage, GeneratedScenario } from "./types";

const mockScenario: GeneratedScenario = {
  templateId: "skeptical-vp",
  title: "The Skeptical VP",
  companyName: "AcmeCorp",
  backstory: "A mid-size SaaS company.",
  buyerName: "Dana Whitfield",
  buyerRole: "VP of Operations",
  personality: "Measured, guarded, allergic to hype.",
  product: "a team-productivity platform",
  sellerStrength: "fast time-to-value",
  sellerWeakness: "thin enterprise track record",
  surfacePains: ["Tool sprawl", "Failed rollout last year", "Manual reporting"],
  hiddenPriority: "Needs a visible internal win for credibility.",
  hiddenPriorityHintTopics: ["last rollout", "internal standing", "adoption"],
  signatureObjection: "We tried this before. It died in a month.",
  budgetSignal: "Budget exists but scarred.",
  stageUnlockCriteria: { discovery: "≥2 pains + impact", pitch: "value tied to pains", negotiate: "objection handled + structure", close: "commitment asked" },
  impatienceConfig: { baseRate: 0.1, genericQuestionPenalty: 0.1 },
  brief: "You are selling to Dana...",
};

describe("buildBuyerPrompt", () => {
  it("includes the META_DELIMITER instruction", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.1, 3);
    expect(p).toContain("---AXIOM_META---");
  });

  it("includes stage-specific behavior for discovery", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p.toLowerCase()).toContain("warm");
    expect(p).toContain("discovery");
  });

  it("includes impatience instructions when level is high", () => {
    const p = buildBuyerPrompt(mockScenario, "pitch", 0.6, 5);
    expect(p.toLowerCase()).toContain("shorter");
  });

  it("includes the hidden priority guard", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p).toContain(mockScenario.hiddenPriority);
    expect(p).toContain("GUARD");
  });

  it("includes stage unlock criteria for the current stage", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p).toContain(mockScenario.stageUnlockCriteria.discovery);
  });
});
```

- [ ] **Step 2: Write buyerPrompt.ts**

The prompt builder takes `(scenario: GeneratedScenario, currentStage: Stage, impatienceLevel: number, turnCount: number)` and returns a system prompt string that:
1. Establishes the buyer's character (name, role, personality, company)
2. Lists surface pains (shared gradually) and hidden priority (guarded)
3. Includes stage-specific behavior instructions based on `currentStage`
4. Includes impatience behavior instructions based on thresholds
5. Includes the objection (only in negotiate stage or later)
6. Instructs the AI to append `---AXIOM_META---` followed by a JSON object with: currentStage, stageJustUnlocked, impatienceLevel, gameOver, gameOverReason, hookLine
7. Includes the stage unlock criteria so the AI can evaluate whether to advance

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/buyerPrompt.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/buyerPrompt.ts src/lib/duel/buyerPrompt.test.ts
git commit -m "feat(v2): add stage-aware buyer prompt with impatience + metadata"
```

---

## Task 7: Variator (AI scenario generation)

**Files:**
- Create: `src/lib/duel/variator.ts`

- [ ] **Step 1: Write variator.ts**

```ts
// src/lib/duel/variator.ts
import { anthropicClient, extractText } from "@/lib/anthropic";
import { VARIATOR_MODEL } from "./config";
import { GeneratedScenario, ScenarioTemplate } from "./types";

export async function generateScenario(
  template: ScenarioTemplate,
  filters?: { industry?: string }
): Promise<GeneratedScenario> {
  const prompt = `Generate a sales scenario variation. Use the template below as the STRUCTURAL foundation (hidden priority, objection, personality, difficulty). Generate FRESH surface details: a new company name, a 2-sentence backstory, a buyer name, specific pain-point numbers, a budget signal, and a product being sold. ${filters?.industry ? `Set in the ${filters.industry} industry.` : "Pick any B2B industry."}

TEMPLATE:
- Archetype: ${template.archetype}
- Buyer role: ${template.buyerRole}
- Personality: ${template.personality}
- Hidden priority: ${template.hiddenPriority}
- Signature objection: ${template.signatureObjection}
- Variation instructions: ${template.variationPrompt}

Return ONLY a JSON object:
{
  "companyName": "<invented company>",
  "backstory": "<2 sentences>",
  "buyerName": "<full name>",
  "product": "<what the player is selling>",
  "sellerStrength": "<one strength>",
  "sellerWeakness": "<one weakness>",
  "surfacePains": ["<pain 1>", "<pain 2>", "<pain 3>"],
  "budgetSignal": "<1 sentence>",
  "brief": "<4-5 sentence player-facing brief>"
}`;

  const completion = await anthropicClient.messages.create({
    model: VARIATOR_MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = extractText(completion);
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("variator returned no JSON");
  const generated = JSON.parse(raw.slice(start, end + 1));

  return {
    templateId: template.id,
    title: template.title,
    companyName: generated.companyName,
    backstory: generated.backstory,
    buyerName: generated.buyerName,
    buyerRole: template.buyerRole,
    personality: template.personality,
    product: generated.product,
    sellerStrength: generated.sellerStrength,
    sellerWeakness: generated.sellerWeakness,
    surfacePains: generated.surfacePains,
    hiddenPriority: template.hiddenPriority,
    hiddenPriorityHintTopics: template.hiddenPriorityHintTopics,
    signatureObjection: template.signatureObjection,
    budgetSignal: generated.budgetSignal,
    stageUnlockCriteria: template.stageUnlockCriteria,
    impatienceConfig: template.impatienceConfig,
    brief: generated.brief,
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/lib/duel/variator.ts
git commit -m "feat(v2): add scenario variator (AI generates surface from template)"
```

---

## Task 8: Verdict Prompt (per-stage AXIOM)

**Files:**
- Create: `src/lib/duel/verdictPrompt.ts`
- Test: `src/lib/duel/verdictPrompt.test.ts`

- [ ] **Step 1: Write the test**

```ts
// src/lib/duel/verdictPrompt.test.ts
import { describe, it, expect } from "vitest";
import { buildVerdictPrompt } from "./verdictPrompt";
import { GeneratedScenario } from "./types";

const mockScenario = { title: "Test", buyerName: "Dana", buyerRole: "VP Ops", hiddenPriority: "needs a win", signatureObjection: "we tried this before" } as GeneratedScenario;

describe("buildVerdictPrompt", () => {
  it("includes Rahul Kothari attribution", () => {
    expect(buildVerdictPrompt(mockScenario, ["discovery", "pitch"])).toContain("Rahul Kothari");
  });
  it("includes per-stage rubric dimensions", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery", "pitch", "negotiate", "close"]);
    expect(p).toContain("painDepth");
    expect(p).toContain("tailoring");
    expect(p).toContain("objection");
    expect(p).toContain("nextSteps");
  });
  it("only scores stages that were reached", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery"]);
    expect(p).toContain("painDepth");
    expect(p).not.toContain("tailoring");
  });
  it("includes roast style guide", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery", "pitch"]);
    expect(p.toLowerCase()).toContain("never punch down");
  });
});
```

- [ ] **Step 2: Write verdictPrompt.ts**

Build a system prompt for AXIOM that: scores only the stages the player reached, uses the per-stage rubric from `scoring.ts`, includes modifiers (efficiency, hidden priority, walkaway, penalties), requests the V2Verdict JSON shape, includes the roast style guide, and attributes to Rahul Kothari.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/duel/verdictPrompt.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/verdictPrompt.ts src/lib/duel/verdictPrompt.test.ts
git commit -m "feat(v2): add per-stage AXIOM verdict prompt"
```

---

## Task 9: Player Module (localStorage identity)

**Files:**
- Create: `src/lib/duel/player.ts`
- Test: `src/lib/duel/player.test.ts`

- [ ] **Step 1: Write player.ts**

```ts
// src/lib/duel/player.ts
"use client";
import { PlayerProfile, TemplateId } from "./types";

const STORAGE_KEY = "beat-axiom:player";

export function getPlayer(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch { return null; }
}

export function savePlayer(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function createPlayer(username: string): PlayerProfile {
  const profile: PlayerProfile = { username, games: [] };
  savePlayer(profile);
  return profile;
}

export function recordGame(game: { templateId: TemplateId; score: number; title: string; shareId: string }): void {
  const profile = getPlayer();
  if (!profile) return;
  profile.games.push({ ...game, date: Date.now() });
  if (profile.games.length > 50) profile.games = profile.games.slice(-50);
  savePlayer(profile);
}
```

- [ ] **Step 2: Write a basic test (jsdom environment)**

```ts
// src/lib/duel/player.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createPlayer, getPlayer, recordGame } from "./player";

describe("player (localStorage)", () => {
  beforeEach(() => { localStorage.clear(); });

  it("creates and retrieves a player", () => {
    createPlayer("Sarvesh");
    const p = getPlayer();
    expect(p?.username).toBe("Sarvesh");
    expect(p?.games).toHaveLength(0);
  });

  it("records games", () => {
    createPlayer("Test");
    recordGame({ templateId: "skeptical-vp", score: 72, title: "Operator", shareId: "abc" });
    const p = getPlayer();
    expect(p?.games).toHaveLength(1);
    expect(p?.games[0].score).toBe(72);
  });
});
```

Note: this test requires `environment: "jsdom"` — add a comment at the top of the test file: `// @vitest-environment jsdom` and install `jsdom` as a dev dependency (`npm install -D jsdom`).

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/lib/duel/player.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/player.ts src/lib/duel/player.test.ts package.json package-lock.json
git commit -m "feat(v2): add localStorage player identity + history"
```

---

## Task 10: API — /api/duel/start

**Files:**
- Create: `src/app/api/duel/start/route.ts`

- [ ] **Step 1: Write the route**

Endpoint: POST with `{ templateId, filters?: { industry?: string } }`.
Logic:
1. Check DUEL_PAUSED
2. Validate templateId (getTemplate or 404)
3. Call `generateScenario(template, filters)`
4. Return `{ scenario: GeneratedScenario }` (the client stores this for the session)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/duel/start/route.ts
git commit -m "feat(v2): add /api/duel/start route (template + variation)"
```

---

## Task 11: API — /api/duel/turn (replaces /avatar)

**Files:**
- Create: `src/app/api/duel/turn/route.ts`
- Delete: `src/app/api/duel/avatar/route.ts`

- [ ] **Step 1: Write the route**

Endpoint: POST with `{ message, history, scenario (GeneratedScenario), currentStage, impatienceLevel, turnTimestamp }`.
Logic:
1. Check DUEL_PAUSED, rate-limit, turnstile
2. Check soft max (history.filter player turns >= SOFT_MAX_TURNS → force game over)
3. Build stage-aware buyer prompt via `buildBuyerPrompt(scenario, currentStage, impatienceLevel, turnCount)`
4. Call AI with history + new message
5. Parse response with `parseResponse()` → split message from metadata
6. Return `{ buyerMessage, ...meta }` (TurnMetadata fields)

- [ ] **Step 2: Delete old avatar route**

```bash
rm -rf src/app/api/duel/avatar
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(v2): add /api/duel/turn route (stage-aware); remove old /avatar"
```

---

## Task 12: API — /api/duel/verdict (rewrite for v2)

**Files:**
- Rewrite: `src/app/api/duel/verdict/route.ts`

- [ ] **Step 1: Rewrite the route**

Endpoint: POST with `{ scenario (GeneratedScenario), history, stagesReached (Stage[]) }`.
Logic:
1. Check DUEL_PAUSED, rate-limit
2. Build verdict prompt via `buildVerdictPrompt(scenario, stagesReached)`
3. Build transcript from history
4. Call AI → parse with `parseV2Verdict()`
5. Save session via `saveSession()` (updated to accept V2Verdict)
6. Return `{ session }`

- [ ] **Step 2: Update store.ts to accept V2Verdict**

Change `saveSession` to accept `V2Verdict` instead of the old `Verdict` type. Update `DuelSession` import.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(v2): rewrite verdict route for per-stage scoring"
```

---

## Task 13: UI — DuelClient.tsx (full rewrite)

**Files:**
- Rewrite: `src/app/duel/DuelClient.tsx`

- [ ] **Step 1: Rewrite the client**

New phases: `"onboard" | "pick" | "brief" | "play" | "scoring"`

Key changes:
- Onboard: asks for username (uses player.ts) or greets returning player
- Pick: shows 8 template cards with difficulty dots, calls /api/duel/start on selection
- Brief: shows the generated brief, "Enter meeting" button
- Play: conversation UI with stage indicator, impatience color on buyer name, hook lines from API metadata, no turn counter, auto-triggers verdict on gameOver
- Scoring: "AXIOM is rendering..." then redirects to /r/[shareId]

UI elements:
- Header: AXIOM avatar + current stage label + 📋 brief toggle + 🔊 mute
- Buyer name color: green (0-0.3), amber (0.3-0.7), red (0.7+) based on impatienceLevel
- Stage unlock: "── stage unlocked: pitch ──" inserted as a log line
- Hook lines from API response shown as [axiom] system lines
- Brief overlay: slide-in panel with the scenario.brief text
- Voice input + SFX carried over from v1

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/duel/DuelClient.tsx
git commit -m "feat(v2): rewrite duel UI — stages, impatience, brief overlay, onboarding"
```

---

## Task 14: Landing Page (onboarding + scenario selection)

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Rewrite landing**

New landing combines:
- The terminal window aesthetic (kept)
- AXIOM avatar + identity (kept)
- Updated copy: "A dynamic sales simulation. Prove you can close." (no "seven questions")
- Returning player: show "welcome back, [name] — last game: [score]"
- CTA goes to /duel (which handles onboarding + pick internally)

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(v2): update landing — dynamic sales simulation copy"
```

---

## Task 15: Cleanup + Integration Test

**Files:**
- Delete: `src/lib/duel/scenarios.ts`, `src/lib/duel/scenarios.test.ts`, `src/lib/duel/avatarPrompt.ts`, `src/lib/duel/avatarPrompt.test.ts`, `src/lib/duel/axiomPrompt.ts`, `src/lib/duel/axiomPrompt.test.ts`, `src/lib/duel/rubric.ts`, `src/lib/duel/rubric.test.ts`
- Update: `src/lib/duel/shareText.ts` (reference stage performance)
- Update: `src/app/r/[shareId]/page.tsx` (display V2Verdict shape)
- Update: `src/app/og/[shareId]/route.tsx` (display V2Verdict shape)

- [ ] **Step 1: Delete old v1 files**

```bash
rm src/lib/duel/scenarios.ts src/lib/duel/scenarios.test.ts \
   src/lib/duel/avatarPrompt.ts src/lib/duel/avatarPrompt.test.ts \
   src/lib/duel/axiomPrompt.ts src/lib/duel/axiomPrompt.test.ts \
   src/lib/duel/rubric.ts src/lib/duel/rubric.test.ts
```

- [ ] **Step 2: Update shareText.ts**

Update `buildShareText` to work with `V2Verdict` (score, title, roast — same fields, just different type import).

- [ ] **Step 3: Update scorecard page + OG route**

Update `/r/[shareId]/page.tsx` and `/og/[shareId]/route.tsx` to read from `V2Verdict` shape (score, title, roast still exist at the same paths — mainly type import changes).

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(v2): cleanup old v1 modules + integrate v2 verdict into scorecard/share"
```

---

## Self-Review

**Spec coverage:**
- §2 Game Loop → Tasks 10 (start), 11 (turn), 12 (verdict), 13 (UI phases) ✓
- §3 Stage Mechanics → Tasks 2 (stages.ts), 6 (buyerPrompt with criteria) ✓
- §4 Impatience → Tasks 2 (thresholds), 6 (prompt instructions), 11 (turn route passes impatience) ✓
- §5 Scoring → Tasks 4 (rubric + parser), 8 (verdict prompt), 12 (verdict route) ✓
- §6 Templates → Tasks 5 (templates), 7 (variator), 10 (start route) ✓
- §7 UI → Tasks 13 (DuelClient), 14 (landing) ✓
- §8 Architecture → All tasks follow the specified file structure ✓
- §9 Migration → Task 15 (v1 scorecards still work — we only change the v2 flow, not existing /r/ pages which read from DuelSession) ✓
- §10 Not in v2 → no leaderboard, auth, enterprise code ✓

**Placeholder scan:** Task 5 (templates.ts) describes content rather than pasting all 8 templates inline — this is intentional because each template is ~30 lines and the file would be 250+ lines of data. The test validates structure; the implementer writes the content following the 3 existing scenarios as reference.

**Type consistency:** `GeneratedScenario`, `TurnMetadata`, `V2Verdict`, `Stage`, `TemplateId` defined in Task 1 and used consistently across all subsequent tasks. `buildBuyerPrompt` signature matches between Task 6 (definition) and Task 11 (call site). `parseResponse` matches between Task 3 (definition) and Task 11 (call site). `parseV2Verdict` matches between Task 4 (definition) and Task 12 (call site).
