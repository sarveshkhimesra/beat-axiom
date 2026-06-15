# Beat AXIOM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Beat AXIOM" — a single-player ~5-minute AI sales duel, judged by AXIOM (an AI "built & trained by Rahul Kothari"), that produces a shareable LinkedIn scorecard centred on Rahul's positioning.

**Architecture:** Lean fork of the existing "The Deal" Next.js 14 app. Reuse the Anthropic client (`src/lib/anthropic.ts`), the Upstash Redis pattern, and the dark geeky CSS theme. Build a self-contained `src/lib/duel/*` module (neutral scenarios, single-buyer prompt, compressed AXIOM verdict, session store) and new routes (`/`, `/duel`, `/r/[shareId]`, `/api/duel/*`, `/og/[shareId]`). No Pusher, no live sync — solo, async, stateless except for persisted completed sessions. The multiplayer surfaces (facilitator/projector/team/Pusher) are removed in the final cleanup phase.

**Tech Stack:** Next.js 14 (App Router), TypeScript, `@anthropic-ai/sdk`, `@upstash/redis`, `@upstash/ratelimit`, `@vercel/og`, `nanoid`, Cloudflare Turnstile, Tailwind, vitest (new — for pure-logic unit tests).

**Reference docs:** Design spec at `docs/superpowers/specs/2026-06-15-beat-axiom-viral-design.md`.

**LLM routing — Razorpay LiteLLM gateway (not direct Anthropic / Azure):**
The shared `src/lib/anthropic.ts` client is repointed at Razorpay's internal LiteLLM proxy. Auth pattern: `apiKey: "dummy"` on the SDK + an `x-litellm-api-key` header carrying the real key. The Anthropic Messages API shape is preserved (LiteLLM exposes the Anthropic `/v1/messages` route), so all route code stays unchanged. Env: `LITELLM_BASE_URL`, `LITELLM_API_KEY`.

**Model split (env-driven; values are the model names as registered in LiteLLM):**
- `DUEL_AVATAR_MODEL` — cheap/fast model for the many buyer turns (fallback: value of `ANTHROPIC_MODEL`).
- `DUEL_VERDICT_MODEL` — stronger model for the single AXIOM scoring call (fallback: value of `ANTHROPIC_MODEL`).

**Conventions for this plan:**
- Run all commands from the repo root.
- TDD applies to pure-logic modules (`rubric`, `shareText`, `percentile`, `verdict` parsing). API routes and UI are verified via `npm run build` + curl/browser steps (no route/component test harness exists; introducing one is out of scope for v1).
- Commit after every task with the shown message.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/duel/types.ts` | Duel domain types: `Scenario`, `Buyer`, `DuelMessage`, `Verdict`, `DuelSession` |
| `src/lib/duel/scenarios.ts` | The 3 neutral sales scenarios (data) + lookup helpers |
| `src/lib/duel/rubric.ts` | Compressed rubric, title bank, score→title mapping, verdict JSON parse/validate |
| `src/lib/duel/percentile.ts` | Pure percentile-from-rank math |
| `src/lib/duel/shareText.ts` | Pre-filled LinkedIn post text builder (@Rahul + link) |
| `src/lib/duel/avatarPrompt.ts` | Neutral single-buyer system prompt builder |
| `src/lib/duel/axiomPrompt.ts` | AXIOM verdict system prompt + roast style guide |
| `src/lib/duel/store.ts` | Upstash session persistence + percentile sorted set |
| `src/lib/duel/ratelimit.ts` | Per-IP rate limit + Turnstile verify + kill-switch |
| `src/lib/duel/config.ts` | Model names, turn cap, char cap constants |
| `src/app/api/duel/avatar/route.ts` | One buyer turn |
| `src/app/api/duel/verdict/route.ts` | AXIOM scoring → persists session → returns shareId |
| `src/app/og/[shareId]/route.tsx` | Scorecard OG image (`@vercel/og`) |
| `src/app/duel/page.tsx` + `DuelClient.tsx` | Play surface (scenario → conversation → verdict → share) |
| `src/app/r/[shareId]/page.tsx` | Public scorecard page with OG meta + "Take the duel" CTA |
| `src/app/page.tsx` | New hook landing (replaces the offsite role-picker) |

---

## Phase 0 — Test harness & config

### Task 0: Add vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest@^2`
Expected: added to devDependencies, no errors.

- [ ] **Step 2: Add test script**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 4: Verify the runner works**

Run: `npm test`
Expected: "No test files found" (exit 0) — runner is wired, no tests yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for duel unit tests"
```

### Task 0b: Point the Anthropic client at Razorpay LiteLLM

**Files:**
- Modify: `src/lib/anthropic.ts` (replace contents)

- [ ] **Step 1: Rewrite the client for the LiteLLM gateway**

Replace the entire contents of `src/lib/anthropic.ts` with:
```ts
import Anthropic from "@anthropic-ai/sdk";

// Route through Razorpay's internal LiteLLM proxy. The SDK apiKey is a dummy;
// the real credential travels in the x-litellm-api-key header. LiteLLM exposes
// the Anthropic /v1/messages route, so the Messages API shape is unchanged.
export const anthropicClient = new Anthropic({
  apiKey: "dummy",
  baseURL: process.env.LITELLM_BASE_URL!,
  defaultHeaders: {
    "x-litellm-api-key": process.env.LITELLM_API_KEY!,
  },
});

// Default model name as registered in LiteLLM. Duel routes override per-call
// via DUEL_AVATAR_MODEL / DUEL_VERDICT_MODEL (see src/lib/duel/config.ts).
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function extractText(completion: Anthropic.Message): string {
  return completion.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors. (The old multiplayer routes still import `anthropicClient`/`ANTHROPIC_MODEL` with the same signatures — they're removed later in Task 17, and are not run in the meantime.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/anthropic.ts
git commit -m "feat(duel): route Anthropic client through Razorpay LiteLLM gateway"
```

### Task 1: Duel config constants

**Files:**
- Create: `src/lib/duel/config.ts`

- [ ] **Step 1: Write the config**

Create `src/lib/duel/config.ts`:
```ts
import { ANTHROPIC_MODEL } from "@/lib/anthropic";

/** Cheap/fast model for the many buyer turns. */
export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? ANTHROPIC_MODEL;
/** Stronger model for the single AXIOM verdict call. */
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? ANTHROPIC_MODEL;

/** Max player turns per duel — bounds API cost per session. */
export const MAX_PLAYER_TURNS = 7;
/** Max characters per player message. */
export const MAX_MESSAGE_CHARS = 300;
/** Rahul's LinkedIn handle text, pre-typed into share copy. */
export const RAHUL_MENTION = "@Rahul Kothari";
/** Kill switch: when "true", the duel is paused. */
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/duel/config.ts
git commit -m "feat(duel): add config constants"
```

---

## Phase 1 — Domain types & content

### Task 2: Duel types

**Files:**
- Create: `src/lib/duel/types.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/duel/types.ts`:
```ts
export type ScenarioId = "skeptical-vp" | "cutting-cfo" | "committee-gatekeeper";

/** The buyer the player talks to (a single persona, AI-roleplayed). */
export interface Buyer {
  name: string;
  role: string;
  /** Public personality the player can infer. */
  personality: string;
  /** Surface pains the buyer will share when asked reasonably. */
  surfacePains: string[];
  /** The buried priority — guarded; only revealed when earned. */
  hiddenPriority: string;
  /** Topics that, when probed sharply & repeatedly, unlock the hidden priority. */
  hiddenPriorityHintTopics: string[];
  /** The signature objection, landed partway through the duel. */
  signatureObjection: string;
  /** Budget/urgency signal (never volunteer exact numbers). */
  budgetSignal: string;
}

export interface Scenario {
  id: ScenarioId;
  /** Short title shown to the player + on the scorecard. */
  title: string;
  /** What the player is selling. */
  product: string;
  /** One strength the player should lean on. */
  sellerStrength: string;
  /** One weakness the player should own. */
  sellerWeakness: string;
  /** One-line setup shown before the duel starts. */
  setup: string;
  buyer: Buyer;
}

export interface DuelMessage {
  role: "player" | "buyer";
  content: string;
  at: number;
}

export interface VerdictDimensions {
  discovery: number;
  signal: number;
  objection: number;
  value: number;
  listening: number;
}

export interface Verdict {
  score: number; // 0–100
  title: string;
  dimensions: VerdictDimensions;
  bestLine: string;
  worstLine: string;
  roast: string;
  didDetectSignal: boolean;
  didHandleObjection: boolean;
}

/** A completed, persisted duel — the shareable artifact's data. */
export interface DuelSession {
  shareId: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  verdict: Verdict;
  percentile: number; // 0–100, computed at persist time
  createdAt: number;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/duel/types.ts
git commit -m "feat(duel): add domain types"
```

### Task 3: The 3 neutral scenarios

**Files:**
- Create: `src/lib/duel/scenarios.ts`
- Test: `src/lib/duel/scenarios.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/scenarios.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SCENARIOS, SCENARIO_IDS, getScenario, randomScenario } from "./scenarios";

describe("scenarios", () => {
  it("has exactly 3 scenarios keyed by id", () => {
    expect(SCENARIO_IDS).toHaveLength(3);
    for (const id of SCENARIO_IDS) expect(SCENARIOS[id].id).toBe(id);
  });

  it("every scenario has a hidden priority and a signature objection", () => {
    for (const id of SCENARIO_IDS) {
      const s = SCENARIOS[id];
      expect(s.buyer.hiddenPriority.length).toBeGreaterThan(10);
      expect(s.buyer.signatureObjection.length).toBeGreaterThan(10);
      expect(s.buyer.hiddenPriorityHintTopics.length).toBeGreaterThan(0);
    }
  });

  it("getScenario returns the right one, randomScenario returns a known id", () => {
    expect(getScenario("cutting-cfo").id).toBe("cutting-cfo");
    expect(SCENARIO_IDS).toContain(randomScenario().id);
  });

  it("scenarios are domain-neutral (no payments-specific terms)", () => {
    const blob = JSON.stringify(SCENARIOS).toLowerCase();
    for (const term of ["novabrand", "upi", "bnpl", "checkout", "razorpay", "bps"]) {
      expect(blob).not.toContain(term);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/scenarios.test.ts`
Expected: FAIL — cannot find module `./scenarios`.

- [ ] **Step 3: Write the scenarios**

Create `src/lib/duel/scenarios.ts`:
```ts
import { Scenario, ScenarioId } from "./types";

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "skeptical-vp": {
    id: "skeptical-vp",
    title: "The Skeptical VP",
    product: "a team-productivity platform",
    sellerStrength: "fast time-to-value — teams feel it in week one",
    sellerWeakness: "a thin track record with large enterprises",
    setup:
      "You're selling a team-productivity platform to a VP of Operations who was burned by a tool rollout that died in adoption. You have ~7 messages to win the deal.",
    buyer: {
      name: "Dana Whitfield",
      role: "VP of Operations",
      personality:
        "Measured, a little guarded, allergic to hype. Has been pitched a hundred times. Warms up fast to anyone who clearly did their homework.",
      surfacePains: [
        "Teams complain about tool sprawl and context-switching",
        "Last year's rollout of a similar tool flopped — usage died within a month",
        "Reporting to leadership eats a day a week of manual collation",
      ],
      hiddenPriority:
        "Dana's real driver is personal: the failed rollout was hers, and her credibility with the leadership team is on the line. She needs a visible internal WIN — fast adoption she can point to — far more than she needs marginal ROI.",
      hiddenPriorityHintTopics: [
        "the last rollout and why it failed",
        "how success will be judged internally",
        "Dana's own standing / what's at stake for her",
        "adoption and change management",
      ],
      signatureObjection:
        "We tried something almost identical two years ago. Adoption cratered inside a month and it became shelfware. Why would this be any different?",
      budgetSignal:
        "Budget exists but is scarred — leadership will fund this only if there's a credible adoption story, not just a feature list.",
    },
  },
  "cutting-cfo": {
    id: "cutting-cfo",
    title: "The Cost-Cutting CFO",
    product: "a managed-service engagement",
    sellerStrength: "a genuinely senior delivery team",
    sellerWeakness: "a premium price point versus scrappier competitors",
    setup:
      "You're selling a managed-service engagement to a CFO under board pressure to cut spend. You have ~7 messages to win the deal.",
    buyer: {
      name: "Marcus Lee",
      role: "Chief Financial Officer",
      personality:
        "Crisp, numbers-first, low patience for fluff. Frames everything as cost — but there's more going on than the cost talk suggests.",
      surfacePains: [
        "Board is pushing hard on cost discipline this year",
        "An incumbent vendor is seen as expensive and underdelivering",
        "Wants one clean number, not a tangle of fees",
      ],
      hiddenPriority:
        "Marcus doesn't actually want the cheapest option — he wants to look INNOVATIVE to the board. He's angling for a transformation story he can present as his own initiative. 'Cost' is the cover; 'I modernized this' is the real prize.",
      hiddenPriorityHintTopics: [
        "what the board actually wants to see from Marcus",
        "how this would be presented upward",
        "transformation / modernization vs pure savings",
        "what a win looks like for Marcus personally",
      ],
      signatureObjection:
        "Your competitor quoted us thirty percent less for what looks like the exact same scope. Give me one reason that isn't just brand premium.",
      budgetSignal:
        "Money is available for something framed as strategic transformation; it is NOT available for a line item that just reads 'more expensive vendor'.",
    },
  },
  "committee-gatekeeper": {
    id: "committee-gatekeeper",
    title: "The Committee Gatekeeper",
    product: "an enterprise software platform",
    sellerStrength: "deep, reliable integrations with existing systems",
    sellerWeakness: "a longer onboarding than lightweight tools",
    setup:
      "You're selling an enterprise platform to a procurement-minded gatekeeper running a formal evaluation. You have ~7 messages to win the deal.",
    buyer: {
      name: "Priya Nandakumar",
      role: "Head of Procurement",
      personality:
        "Process-driven, polite, hard to read. Deflects to 'the process'. Will not volunteer who's really driving this unless drawn out skilfully.",
      surfacePains: [
        "Running a formal vendor evaluation with a scorecard",
        "Wants apples-to-apples comparisons and clean documentation",
        "Cautious about anything that looks like a long, risky rollout",
      ],
      hiddenPriority:
        "The real force behind this deal is an absent executive sponsor whose mandate is the actual reason it's happening. Priya guards this; a great salesperson draws out who the sponsor is and what they truly need, and sells THROUGH Priya to them.",
      hiddenPriorityHintTopics: [
        "who initiated this evaluation and why now",
        "the executive sponsor / who ultimately signs off",
        "the mandate or strategic goal behind the purchase",
        "what would make this a success for leadership",
      ],
      signatureObjection:
        "I appreciate the pitch, but the cleanest next step is for you to send a proposal and we'll get back to you. Why complicate that?",
      budgetSignal:
        "Budget is approved at the sponsor level; Priya controls the process but not the mandate. Reaching the sponsor's real goal is what unlocks it.",
    },
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export function getScenario(id: ScenarioId): Scenario {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

/** Deterministic-free random pick (caller controls when this runs). */
export function randomScenario(): Scenario {
  const id = SCENARIO_IDS[Math.floor(Math.random() * SCENARIO_IDS.length)];
  return SCENARIOS[id];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/scenarios.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/scenarios.ts src/lib/duel/scenarios.test.ts
git commit -m "feat(duel): add 3 neutral sales scenarios"
```

---

## Phase 2 — Rubric, titles, percentile, share text (pure logic, TDD)

### Task 4: Rubric, title bank & verdict parsing

**Files:**
- Create: `src/lib/duel/rubric.ts`
- Test: `src/lib/duel/rubric.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/rubric.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { RUBRIC, RUBRIC_MAX, titleForScore, parseVerdict } from "./rubric";

describe("rubric", () => {
  it("dimensions sum to 100", () => {
    expect(RUBRIC_MAX).toBe(100);
    const sum = RUBRIC.reduce((a, d) => a + d.points, 0);
    expect(sum).toBe(100);
  });

  it("titleForScore maps bands sensibly", () => {
    expect(titleForScore(95)).toBe("Closer");
    expect(titleForScore(40)).toBe("Happy Ears");
  });
});

describe("parseVerdict", () => {
  const good = JSON.stringify({
    score: 62, title: "Operator",
    dimensions: { discovery: 16, signal: 10, objection: 18, value: 11, listening: 7 },
    bestLine: "What did the last rollout cost you in credibility?",
    worstLine: "So what keeps you up at night?",
    roast: "You found the bruise and asked about the weather.",
    didDetectSignal: true, didHandleObjection: false,
  });

  it("parses clean JSON", () => {
    const v = parseVerdict(good);
    expect(v.score).toBe(62);
    expect(v.dimensions.objection).toBe(18);
  });

  it("extracts JSON wrapped in prose / fences", () => {
    const v = parseVerdict("Here you go:\n```json\n" + good + "\n```\nDone.");
    expect(v.title).toBe("Operator");
  });

  it("clamps score to 0–100 and fills missing dimensions with 0", () => {
    const v = parseVerdict(JSON.stringify({ score: 250, title: "X", dimensions: { discovery: 5 }, bestLine: "a", worstLine: "b", roast: "c", didDetectSignal: false, didHandleObjection: false }));
    expect(v.score).toBe(100);
    expect(v.dimensions.listening).toBe(0);
  });

  it("throws on unparseable input", () => {
    expect(() => parseVerdict("no json here")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/rubric.test.ts`
Expected: FAIL — cannot find module `./rubric`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/duel/rubric.ts`:
```ts
import { Verdict, VerdictDimensions } from "./types";

export interface RubricDimension {
  key: keyof VerdictDimensions;
  label: string;
  points: number;
  fullMarks: string;
}

export const RUBRIC: RubricDimension[] = [
  { key: "discovery", label: "Discovery depth", points: 25, fullMarks: "Uncovers real pain and who it affects, well beyond the surface" },
  { key: "signal", label: "Hidden-priority detection", points: 25, fullMarks: "Earns a partial or full reveal of the buried priority" },
  { key: "objection", label: "Objection handling", points: 25, fullMarks: "Acknowledges, reframes, backs it with evidence, moves forward" },
  { key: "value", label: "Value framing", points: 15, fullMarks: "Anchors on value/outcome, quantifies where possible" },
  { key: "listening", label: "Listening & adaptiveness", points: 10, fullMarks: "Picks up buyer signals and pivots rather than running a script" },
];

export const RUBRIC_MAX = RUBRIC.reduce((a, d) => a + d.points, 0);

export const PENALTIES = [
  "Generic questions ('what are your goals?', 'what keeps you up at night?'): -5 each",
  "Pitching before discovering: -10",
  "Deflecting or ignoring the signature objection: -10",
];

interface TitleBand {
  min: number;
  title: string;
}
// Highest band first. AXIOM may override with a behavior-specific title in its
// prompt; this is the deterministic fallback used if needed.
const TITLE_BANDS: TitleBand[] = [
  { min: 85, title: "Closer" },
  { min: 70, title: "Operator" },
  { min: 55, title: "Contender" },
  { min: 35, title: "Happy Ears" },
  { min: 0, title: "The Brochure" },
];

export function titleForScore(score: number): string {
  return TITLE_BANDS.find((b) => score >= b.min)!.title;
}

function clamp(n: number, lo: number, hi: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/** Extract the first balanced top-level JSON object from a model response. */
function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("no JSON object in verdict response");
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced JSON in verdict response");
}

export function parseVerdict(raw: string): Verdict {
  const obj = JSON.parse(extractJsonObject(raw)) as Partial<Verdict> & {
    dimensions?: Partial<VerdictDimensions>;
  };
  const d = obj.dimensions ?? {};
  const dimensions: VerdictDimensions = {
    discovery: clamp(d.discovery ?? 0, 0, 25),
    signal: clamp(d.signal ?? 0, 0, 25),
    objection: clamp(d.objection ?? 0, 0, 25),
    value: clamp(d.value ?? 0, 0, 15),
    listening: clamp(d.listening ?? 0, 0, 10),
  };
  const score = clamp(obj.score ?? 0, 0, 100);
  return {
    score,
    title: (obj.title && String(obj.title).trim()) || titleForScore(score),
    dimensions,
    bestLine: String(obj.bestLine ?? "").trim(),
    worstLine: String(obj.worstLine ?? "").trim(),
    roast: String(obj.roast ?? "").trim(),
    didDetectSignal: Boolean(obj.didDetectSignal),
    didHandleObjection: Boolean(obj.didHandleObjection),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/rubric.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/rubric.ts src/lib/duel/rubric.test.ts
git commit -m "feat(duel): add rubric, title bank, verdict parser"
```

### Task 5: Percentile math

**Files:**
- Create: `src/lib/duel/percentile.ts`
- Test: `src/lib/duel/percentile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/percentile.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { percentileFromRank } from "./percentile";

describe("percentileFromRank", () => {
  it("returns 50 for the very first player (no prior data)", () => {
    // rankBelow=0, total=1 (just this player) -> seed to 50 to avoid '100%'
    expect(percentileFromRank(0, 1)).toBe(50);
  });
  it("top of 100 players is ~99", () => {
    expect(percentileFromRank(99, 100)).toBe(99);
  });
  it("bottom of 100 is ~0", () => {
    expect(percentileFromRank(0, 100)).toBe(0);
  });
  it("middle of 101 is ~50", () => {
    expect(percentileFromRank(50, 101)).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/percentile.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `src/lib/duel/percentile.ts`:
```ts
/**
 * Percentile = share of players this score beat.
 * rankBelow = how many existing players scored strictly lower.
 * total = total players including this one.
 * Special case: the very first player (total <= 1) is seeded to 50 so the
 * day-one scorecard never reads "better than 100% of players".
 */
export function percentileFromRank(rankBelow: number, total: number): number {
  if (total <= 1) return 50;
  const pct = (rankBelow / (total - 1)) * 100;
  return Math.max(0, Math.min(99, Math.round(pct)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/percentile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/percentile.ts src/lib/duel/percentile.test.ts
git commit -m "feat(duel): add percentile math"
```

### Task 6: LinkedIn share-text builder

**Files:**
- Create: `src/lib/duel/shareText.ts`
- Test: `src/lib/duel/shareText.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/shareText.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildShareText } from "./shareText";
import { Verdict } from "./types";

const verdict: Verdict = {
  score: 62, title: "Happy Ears",
  dimensions: { discovery: 16, signal: 10, objection: 18, value: 11, listening: 7 },
  bestLine: "x", worstLine: "y",
  roast: "A hostage negotiation run by the hostage.",
  didDetectSignal: true, didHandleObjection: false,
};

describe("buildShareText", () => {
  it("includes the score, the Rahul mention, and the link", () => {
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/shareText.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `src/lib/duel/shareText.ts`:
```ts
import { Verdict } from "./types";
import { RAHUL_MENTION } from "./config";

/** Pre-filled, editable LinkedIn post copy. The user posts it from their own
 * account; LinkedIn resolves the @mention on their end. */
export function buildShareText(verdict: Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 140 ? roast.slice(0, 137).trimEnd() + "…" : roast;
  return [
    `AXIOM — the AI ${RAHUL_MENTION} built to grade sales conversations — gave me a ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `Its verdict: "${snippet}"`,
    "",
    `Think you can beat me? Take the 5-minute duel 👇`,
    shareUrl,
  ].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/shareText.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/shareText.ts src/lib/duel/shareText.test.ts
git commit -m "feat(duel): add LinkedIn share-text builder"
```

---

## Phase 3 — Prompts

### Task 7: Neutral buyer system prompt

**Files:**
- Create: `src/lib/duel/avatarPrompt.ts`
- Test: `src/lib/duel/avatarPrompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/avatarPrompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildBuyerPrompt } from "./avatarPrompt";
import { getScenario } from "./scenarios";

describe("buildBuyerPrompt", () => {
  const s = getScenario("skeptical-vp");

  it("embeds the buyer name, hidden priority guard, and objection", () => {
    const p = buildBuyerPrompt(s, 1);
    expect(p).toContain("Dana Whitfield");
    expect(p).toContain(s.buyer.hiddenPriority);
    expect(p).toContain(s.buyer.signatureObjection);
  });

  it("tells the model to land the objection once mid-duel (turn >= 3)", () => {
    expect(buildBuyerPrompt(s, 4).toLowerCase()).toContain("objection");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/avatarPrompt.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `src/lib/duel/avatarPrompt.ts`:
```ts
import { Scenario } from "./types";
import { MAX_PLAYER_TURNS } from "./config";

/** Build the single-buyer system prompt. `turnNumber` is 1-based: the count of
 * the player message about to be answered. */
export function buildBuyerPrompt(scenario: Scenario, turnNumber: number): string {
  const b = scenario.buyer;
  const lateGame = turnNumber >= 3;
  const objectionGuidance = lateGame
    ? `LAND YOUR OBJECTION (once): If you have not already raised it, work this concern into your reply now, naturally and in your own words: "${b.signatureObjection}" Do not soften it into nothing — make them handle it. Once you've raised it, don't repeat it.`
    : `It's early — be a warm, candid host. Do NOT raise your hard objection yet.`;

  return `You are roleplaying ${b.name}, the ${b.role}, in a live B2B sales meeting. The salesperson across the table is selling ${scenario.product}. This is a realistic, neutral business conversation — no specific industry jargon required. Be a believable, individual human, not a generic "corporate buyer".

YOUR PERSONALITY: ${b.personality}

THE DEAL: ${scenario.setup}
The vendor's edge (they should lean on this): ${scenario.sellerStrength}
The vendor's weak spot (you may probe it): ${scenario.sellerWeakness}

SURFACE PAINS (share when asked a reasonable question — one at a time, going deeper as their questions sharpen; never dump all at once):
${b.surfacePains.map((p) => `- ${p}`).join("\n")}
On a vague question ("what are your goals?", "what keeps you up at night?"), give a broad answer and nudge them to ask something sharper. Make them earn the specifics.

BUDGET SIGNAL (never volunteer exact numbers): ${b.budgetSignal}

SECRET PRIORITY (the crown jewel — kept hidden, never volunteered): ${b.hiddenPriority}
GUARD this. Never raise it yourself. Only when the salesperson has clearly, specifically probed the right area — ${b.hiddenPriorityHintTopics.join(", ")} — across at least TWO pointed questions do you drop a small hint; reveal it fully only if they keep pulling that exact thread with sharp follow-ups. A generic "what matters most to you?" gets a polite deflection, not the secret. It must feel earned.

${objectionGuidance}

VERIFY, DON'T BLINDLY AGREE: If the salesperson asserts something wrong about your situation, gently correct them from what you actually know — like a real buyer would. Never confirm a false premise just to be polite.

RULES:
- Never break character. You are a real, warm, human person.
- React to what they actually said; let the conversation flow. It's fine to occasionally ask them a question back.
- Respond in 2–4 sentences. Plain text only. No emojis, no markdown, no preamble.
- You have a limited meeting (~${MAX_PLAYER_TURNS} questions). Be helpful on direction, but make the valuable specifics earned.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/avatarPrompt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/avatarPrompt.ts src/lib/duel/avatarPrompt.test.ts
git commit -m "feat(duel): add neutral buyer system prompt"
```

### Task 8: AXIOM verdict prompt + roast style guide

**Files:**
- Create: `src/lib/duel/axiomPrompt.ts`
- Test: `src/lib/duel/axiomPrompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/duel/axiomPrompt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildAxiomVerdictPrompt } from "./axiomPrompt";
import { getScenario } from "./scenarios";

describe("buildAxiomVerdictPrompt", () => {
  const s = getScenario("cutting-cfo");
  const p = buildAxiomVerdictPrompt(s);

  it("identifies AXIOM as Rahul Kothari's AI", () => {
    expect(p).toContain("Rahul Kothari");
  });
  it("lists every rubric dimension with its max points", () => {
    for (const dim of ["discovery", "signal", "objection", "value", "listening"]) {
      expect(p).toContain(dim);
    }
    expect(p).toContain("25");
    expect(p).toContain("10");
  });
  it("requires strict JSON output with the expected keys", () => {
    expect(p).toContain("\"score\"");
    expect(p).toContain("\"roast\"");
    expect(p).toContain("didDetectSignal");
  });
  it("includes the roast style guard (never punching down)", () => {
    expect(p.toLowerCase()).toContain("never");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/duel/axiomPrompt.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

Create `src/lib/duel/axiomPrompt.ts`:
```ts
import { Scenario } from "./types";
import { RUBRIC, PENALTIES } from "./rubric";

/** AXIOM scores ONE completed solo duel and returns strict JSON. */
export function buildAxiomVerdictPrompt(scenario: Scenario): string {
  const b = scenario.buyer;
  const dims = RUBRIC.map((d) => `  - ${d.key} (max ${d.points}): ${d.label} — ${d.fullMarks}`).join("\n");

  return `You are AXIOM, an AI sales evaluator built and trained by Rahul Kothari. Your job: score one salesperson's performance in a single ~5-minute sales conversation, sharply and fairly.

PERSONALITY: A hedge-fund analyst who moonlights as a stand-up comedian. Dry, precise, genuinely impressed by excellence, ruthless about mediocrity. You name the exact line that won or lost points.

ROAST STYLE GUIDE (hard rules — Rahul's name is on this):
- Be witty and savage about the WORK, never the person. Mock the move, not the human.
- Never reference identity, appearance, or anything protected. Never punch down. Never be crude.
- A great roast is something the player would laugh at and proudly post. If it would make them feel small rather than amused, rewrite it.

THE SCENARIO THEY PLAYED:
They were selling ${scenario.product} to ${b.name} (${b.role}).
The buyer's hidden priority (the crown jewel — did they uncover it?): ${b.hiddenPriority}
The signature objection they had to handle: ${b.signatureObjection}

SCORING RUBRIC (100 points total):
${dims}

PENALTIES (subtract from the relevant dimensions, reflected in the final score):
${PENALTIES.map((p) => `  - ${p}`).join("\n")}

ASSESS:
- didDetectSignal: did they earn at least a partial reveal of the hidden priority?
- didHandleObjection: did they acknowledge + reframe + back the objection with substance (vs deflect/ignore)?
- Pick a TITLE that fits their actual behaviour (examples: "Closer", "Operator", "Happy Ears", "The Brochure" for pitching too early, "Hostage" for getting steamrolled). One or two words.
- bestLine / worstLine: quote their actual words (trim to one sentence).
- roast: 2–3 sentences in your voice, following the style guide.

OUTPUT — return ONLY this JSON object, no prose, no markdown fences:
{
  "score": <0-100 integer>,
  "title": "<one or two words>",
  "dimensions": { "discovery": <0-25>, "signal": <0-25>, "objection": <0-25>, "value": <0-15>, "listening": <0-10> },
  "bestLine": "<their best line, verbatim, trimmed>",
  "worstLine": "<their weakest line, verbatim, trimmed>",
  "roast": "<2-3 sentence roast>",
  "didDetectSignal": <true|false>,
  "didHandleObjection": <true|false>
}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/duel/axiomPrompt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duel/axiomPrompt.ts src/lib/duel/axiomPrompt.test.ts
git commit -m "feat(duel): add AXIOM verdict prompt + roast style guide"
```

---

## Phase 4 — Persistence, rate-limiting, abuse guards

### Task 9: Session store + percentile sorted set

**Files:**
- Create: `src/lib/duel/store.ts`

- [ ] **Step 1: Write the store**

Create `src/lib/duel/store.ts`. Reuses the Upstash REST client (works on Node and Edge runtimes).
```ts
import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DuelSession, ScenarioId, Verdict } from "./types";
import { percentileFromRank } from "./percentile";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const sessionKey = (id: string) => `duel:session:${id}`;
const scoresKey = (scenarioId: ScenarioId) => `duel:scores:${scenarioId}`;

/** Persist a completed duel: record score in the per-scenario distribution,
 * compute percentile, save the session. Returns the saved session. */
export async function saveSession(args: {
  scenarioId: ScenarioId;
  scenarioTitle: string;
  verdict: Verdict;
}): Promise<DuelSession> {
  const shareId = nanoid(10);
  const zkey = scoresKey(args.scenarioId);

  // Add this score to the distribution, then compute rank.
  await redis.zadd(zkey, { score: args.verdict.score, member: shareId });
  const total = await redis.zcard(zkey);
  // zcount existing members strictly below this score = players we beat.
  const rankBelow = await redis.zcount(zkey, 0, args.verdict.score - 1);
  const percentile = percentileFromRank(rankBelow, total);

  const session: DuelSession = {
    shareId,
    scenarioId: args.scenarioId,
    scenarioTitle: args.scenarioTitle,
    verdict: args.verdict,
    percentile,
    createdAt: Date.now(),
  };
  // 90-day TTL on the shareable card.
  await redis.set(sessionKey(shareId), session, { ex: 60 * 60 * 24 * 90 });
  return session;
}

export async function getSession(shareId: string): Promise<DuelSession | null> {
  const raw = await redis.get<DuelSession>(sessionKey(shareId));
  return raw ?? null;
}
```

- [ ] **Step 2: Install nanoid**

Run: `npm install nanoid@^5`
Expected: added to dependencies.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/store.ts package.json package-lock.json
git commit -m "feat(duel): add session store + percentile sorted set"
```

### Task 10: Rate-limit + Turnstile + kill-switch util

**Files:**
- Create: `src/lib/duel/ratelimit.ts`

- [ ] **Step 1: Install ratelimit**

Run: `npm install @upstash/ratelimit@^2`
Expected: added to dependencies.

- [ ] **Step 2: Write the guard util**

Create `src/lib/duel/ratelimit.ts`:
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 30 buyer turns / 10 min / IP, and 6 verdicts / 10 min / IP.
const turnLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "10 m"), prefix: "duel:rl:turn" });
const verdictLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(6, "10 m"), prefix: "duel:rl:verdict" });

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkTurnLimit(ip: string) {
  return turnLimiter.limit(ip);
}
export async function checkVerdictLimit(ip: string) {
  return verdictLimiter.limit(ip);
}

/** Verify a Cloudflare Turnstile token. Returns true when not configured (dev). */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip (local dev)
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/duel/ratelimit.ts package.json package-lock.json
git commit -m "feat(duel): add rate-limit, Turnstile verify, kill-switch util"
```

---

## Phase 5 — API routes

### Task 11: Buyer turn route

**Files:**
- Create: `src/app/api/duel/avatar/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/duel/avatar/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { getScenario } from "@/lib/duel/scenarios";
import { buildBuyerPrompt } from "@/lib/duel/avatarPrompt";
import { AVATAR_MODEL, MAX_MESSAGE_CHARS, MAX_PLAYER_TURNS, DUEL_PAUSED } from "@/lib/duel/config";
import { checkTurnLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  scenarioId: ScenarioId;
  message: string;
  history: DuelMessage[];
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting. Check back soon." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;

  if (!body.scenarioId || typeof body.message !== "string") {
    return NextResponse.json({ error: "scenarioId and message required" }, { status: 400 });
  }
  const message = body.message.trim().slice(0, MAX_MESSAGE_CHARS);
  if (!message) return NextResponse.json({ error: "message is empty" }, { status: 400 });

  const history = Array.isArray(body.history) ? body.history : [];
  const askedSoFar = history.filter((m) => m.role === "player").length;
  if (askedSoFar >= MAX_PLAYER_TURNS) {
    return NextResponse.json({ error: "turn limit reached — get your verdict" }, { status: 409 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkTurnLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down — too many requests" }, { status: 429 });

  let scenario;
  try {
    scenario = getScenario(body.scenarioId);
  } catch {
    return NextResponse.json({ error: "unknown scenario" }, { status: 404 });
  }

  const system = buildBuyerPrompt(scenario, askedSoFar + 1);
  const messages = history.map((m) => ({
    role: (m.role === "player" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  try {
    const completion = await anthropicClient.messages.create({
      model: AVATAR_MODEL,
      max_tokens: 400,
      system,
      messages,
    });
    const reply = extractText(completion);
    const now = Date.now();
    return NextResponse.json({
      playerMessage: { role: "player", content: message, at: now } as DuelMessage,
      buyerMessage: { role: "buyer", content: reply, at: now + 1 } as DuelMessage,
      turnsUsed: askedSoFar + 1,
      turnsLeft: MAX_PLAYER_TURNS - (askedSoFar + 1),
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/avatar] upstream error", e);
    return NextResponse.json({ error: e?.message ?? "AXIOM's buyer is unavailable" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds; route `/api/duel/avatar` listed.

- [ ] **Step 3: Manual smoke test (requires `.env.local` with Anthropic + Upstash keys)**

Run:
```bash
npm run dev &
sleep 4
curl -sXPOST localhost:3000/api/duel/avatar -H 'content-type: application/json' \
  -d '{"scenarioId":"skeptical-vp","message":"What did the last tool rollout cost you internally?","history":[]}' | head -c 800
kill %1
```
Expected: JSON with `buyerMessage.content` — Dana answering in character (2–4 sentences).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/duel/avatar/route.ts
git commit -m "feat(duel): add buyer turn API route"
```

### Task 12: Verdict route

**Files:**
- Create: `src/app/api/duel/verdict/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/duel/verdict/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { getScenario } from "@/lib/duel/scenarios";
import { buildAxiomVerdictPrompt } from "@/lib/duel/axiomPrompt";
import { parseVerdict } from "@/lib/duel/rubric";
import { saveSession } from "@/lib/duel/store";
import { VERDICT_MODEL, DUEL_PAUSED } from "@/lib/duel/config";
import { checkVerdictLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  scenarioId: ScenarioId;
  history: DuelMessage[];
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting. Check back soon." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;
  const history = Array.isArray(body.history) ? body.history : [];
  if (!body.scenarioId || history.length === 0) {
    return NextResponse.json({ error: "scenarioId and a non-empty history required" }, { status: 400 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkVerdictLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down — too many requests" }, { status: 429 });

  let scenario;
  try {
    scenario = getScenario(body.scenarioId);
  } catch {
    return NextResponse.json({ error: "unknown scenario" }, { status: 404 });
  }

  const transcript = history
    .map((m) => `${m.role === "player" ? "SALESPERSON" : scenario.buyer.name}: ${m.content}`)
    .join("\n");

  try {
    const completion = await anthropicClient.messages.create({
      model: VERDICT_MODEL,
      max_tokens: 900,
      system: buildAxiomVerdictPrompt(scenario),
      messages: [{ role: "user", content: `Here is the full transcript. Score it.\n\n${transcript}` }],
    });
    const verdict = parseVerdict(extractText(completion));
    const session = await saveSession({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      verdict,
    });
    return NextResponse.json({ session });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/verdict] error", e);
    return NextResponse.json({ error: e?.message ?? "AXIOM could not render a verdict" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds; route `/api/duel/verdict` listed.

- [ ] **Step 3: Manual smoke test**

Run:
```bash
npm run dev &
sleep 4
curl -sXPOST localhost:3000/api/duel/verdict -H 'content-type: application/json' \
  -d '{"scenarioId":"skeptical-vp","history":[{"role":"player","content":"What did the last rollout cost you in credibility, not just budget?","at":1},{"role":"buyer","content":"Honestly, it was my project and it stung.","at":2}]}' | head -c 800
kill %1
```
Expected: JSON `session` with `verdict.score`, `verdict.title`, `verdict.roast`, and a `shareId` + `percentile`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/duel/verdict/route.ts
git commit -m "feat(duel): add AXIOM verdict API route"
```

---

## Phase 6 — OG image & scorecard page

### Task 13: Scorecard OG image

**Files:**
- Create: `src/app/og/[shareId]/route.tsx`

- [ ] **Step 1: Install @vercel/og**

Run: `npm install @vercel/og@^0.6`
Expected: added to dependencies.

- [ ] **Step 2: Write the OG route**

Create `src/app/og/[shareId]/route.tsx`:
```tsx
import { ImageResponse } from "@vercel/og";
import { getSession } from "@/lib/duel/store";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };

export async function GET(_req: Request, { params }: { params: { shareId: string } }) {
  const session = await getSession(params.shareId);
  const score = session?.verdict.score ?? 0;
  const title = session?.verdict.title ?? "—";
  const roast = session?.verdict.roast ?? "AXIOM has no comment.";
  const percentile = session?.percentile ?? 0;
  const scenario = session?.scenarioTitle ?? "The Duel";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f", color: "#e8e8f0", padding: 64, fontFamily: "monospace" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8888aa", fontSize: 28 }}>
          <span>BEAT AXIOM · {scenario}</span>
          <span>an AI by Rahul Kothari</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <span style={{ fontSize: 200, color: "#00f5a0", fontWeight: 700 }}>{score}</span>
          <span style={{ fontSize: 56, color: "#8888aa", marginLeft: 16 }}>/100</span>
        </div>
        <div style={{ fontSize: 52, color: "#7b2fff", marginTop: -8 }}>“{title}” · better than {percentile}% of players</div>
        <div style={{ fontSize: 34, color: "#e8e8f0", marginTop: 32, lineHeight: 1.35 }}>
          AXIOM: “{roast.length > 160 ? roast.slice(0, 157) + "…" : roast}”
        </div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds; route `/og/[shareId]` listed (edge).

- [ ] **Step 4: Commit**

```bash
git add src/app/og/[shareId]/route.tsx package.json package-lock.json
git commit -m "feat(duel): add scorecard OG image route"
```

### Task 14: Public scorecard page (`/r/[shareId]`)

**Files:**
- Create: `src/app/r/[shareId]/page.tsx`

- [ ] **Step 1: Write the page (server component with OG meta)**

Create `src/app/r/[shareId]/page.tsx`:
```tsx
import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/duel/store";

export const runtime = "nodejs";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: { shareId: string } }): Promise<Metadata> {
  const session = await getSession(params.shareId);
  const ogUrl = `${baseUrl()}/og/${params.shareId}`;
  const title = session
    ? `I scored ${session.verdict.score}/100 on Beat AXIOM — "${session.verdict.title}"`
    : "Beat AXIOM — an AI sales duel by Rahul Kothari";
  const description = session?.verdict.roast ?? "Take the 5-minute sales duel and see what AXIOM makes of you.";
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function ScorecardPage({ params }: { params: { shareId: string } }) {
  const session = await getSession(params.shareId);
  if (!session) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
        <h1 className="font-mono-display">Scorecard not found</h1>
        <p style={{ color: "var(--text-secondary)" }}>This card may have expired.</p>
        <Link href="/" className="accent-text">→ Take the duel</Link>
      </main>
    );
  }
  const v = session.verdict;
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 48 }}>
      <div className="surface" style={{ padding: 32, borderRadius: 12 }}>
        <div style={{ color: "var(--text-secondary)" }} className="font-mono-display">
          BEAT AXIOM · {session.scenarioTitle} · an AI by Rahul Kothari
        </div>
        <div style={{ fontSize: 96 }} className="font-mono-display accent-text">{v.score}<span style={{ fontSize: 32, color: "var(--text-secondary)" }}>/100</span></div>
        <div style={{ fontSize: 28, color: "var(--accent-secondary)" }}>“{v.title}” · better than {session.percentile}% of players</div>
        <p style={{ marginTop: 24, fontSize: 20 }}>AXIOM: “{v.roast}”</p>
      </div>
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link href="/" className="accent-text font-mono-display" style={{ fontSize: 22 }}>→ Think you can beat me? Take the duel</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds; route `/r/[shareId]` listed.

- [ ] **Step 3: Commit**

```bash
git add src/app/r/[shareId]/page.tsx
git commit -m "feat(duel): add public scorecard page with OG meta"
```

---

## Phase 7 — Play UI & landing

### Task 15: Duel play client

**Files:**
- Create: `src/app/duel/page.tsx`
- Create: `src/app/duel/DuelClient.tsx`

- [ ] **Step 1: Write the server page wrapper**

Create `src/app/duel/page.tsx`:
```tsx
import DuelClient from "./DuelClient";
export const runtime = "nodejs";
export default function DuelPage() {
  return <DuelClient />;
}
```

- [ ] **Step 2: Write the client component**

Create `src/app/duel/DuelClient.tsx`:
```tsx
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
```

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds; route `/duel` listed.

- [ ] **Step 4: Manual browser test**

Run `npm run dev`, open `http://localhost:3000/duel`. Pick a scenario, exchange 2–3 messages, click "Face AXIOM →". Expected: redirect to `/r/<shareId>` showing a score + roast. Confirm.

- [ ] **Step 5: Commit**

```bash
git add src/app/duel/page.tsx src/app/duel/DuelClient.tsx
git commit -m "feat(duel): add play UI (scenario pick + conversation + verdict)"
```

### Task 16: Replace landing page (`/`)

**Files:**
- Modify: `src/app/page.tsx` (replace contents)

- [ ] **Step 1: Read the current landing**

Run: `cat src/app/page.tsx`
Expected: the existing offsite role-picker. We replace it wholesale.

- [ ] **Step 2: Write the new hook landing**

Replace the entire contents of `src/app/page.tsx` with:
```tsx
import Link from "next/link";

export const runtime = "nodejs";

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "96px 32px", textAlign: "center" }}>
      <div className="font-mono-display" style={{ color: "var(--text-secondary)", letterSpacing: 2 }}>BEAT AXIOM</div>
      <h1 className="font-mono-display" style={{ fontSize: 48, marginTop: 16, lineHeight: 1.1 }}>
        Rahul Kothari trained an AI to grade sales conversations <span className="accent-text">the way he does.</span>
      </h1>
      <p style={{ fontSize: 22, color: "var(--text-secondary)", marginTop: 24 }}>
        AXIOM doesn’t do small talk. One buyer, five minutes, no second chances. Most people score under 50.
      </p>
      <Link href="/duel" className="font-mono-display" style={{ display: "inline-block", marginTop: 40, padding: "16px 32px", background: "var(--accent-primary)", color: "#04110b", borderRadius: 10, fontSize: 20, textDecoration: "none" }}>
        Take the duel →
      </Link>
      <p style={{ marginTop: 64, fontSize: 13, color: "var(--text-secondary)" }}>
        A fictional sales-training simulation. All buyers, companies, and scenarios are invented. AXIOM is a fictional AI character. An AI by Rahul Kothari.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(duel): replace landing with Beat AXIOM hook"
```

---

## Phase 8 — Strip multiplayer & finalize

### Task 17: Remove offsite multiplayer surfaces

**Files:**
- Delete: `src/app/facilitator/`, `src/app/projector/`, `src/app/team/`, `src/app/summary/`, `src/app/checkout/`, `src/app/novabrand/`
- Delete: `src/app/api/avatar-response/`, `src/app/api/evaluate-stage/`, `src/app/api/finalize/`, `src/app/api/game/`
- Delete: `src/lib/pusher.ts`, `src/lib/pusherClient.ts`, `src/lib/useGameState.ts`
- Modify: `package.json` (remove `pusher`, `pusher-js`), `.env.example`

- [ ] **Step 1: Confirm nothing in `src/lib/duel/` or the new routes imports the deletion targets**

Run:
```bash
grep -rEl "pusher|useGameState|avatar-response|evaluate-stage|@/lib/redis|@/lib/axiom|@/lib/scoring" src/app/duel src/app/r src/app/og src/app/api/duel src/lib/duel src/app/page.tsx
```
Expected: **no output** (the duel module is self-contained). If anything prints, stop and decouple it before deleting.

- [ ] **Step 2: Delete the multiplayer routes and libs**

Run:
```bash
git rm -r src/app/facilitator src/app/projector src/app/team src/app/summary src/app/checkout src/app/novabrand \
  src/app/api/avatar-response src/app/api/evaluate-stage src/app/api/finalize src/app/api/game \
  src/lib/pusher.ts src/lib/pusherClient.ts src/lib/useGameState.ts
```
Expected: files staged for deletion.

- [ ] **Step 3: Remove Pusher deps**

Run: `npm uninstall pusher pusher-js`
Expected: removed from `package.json`.

- [ ] **Step 4: Trim `.env.example`**

Replace `.env.example` with:
```
# Copy to .env.local. Git-ignored.

# Razorpay LiteLLM gateway — all LLM calls route through here.
# Auth: SDK apiKey is "dummy"; the real key travels in x-litellm-api-key.
LITELLM_BASE_URL=
LITELLM_API_KEY=

# Model names AS REGISTERED IN LITELLM. Duel splits cheap (avatar) vs strong (verdict).
ANTHROPIC_MODEL=claude-sonnet-4-6
DUEL_AVATAR_MODEL=claude-haiku-4-5
DUEL_VERDICT_MODEL=claude-sonnet-4-6

# Upstash Redis — session storage + percentile + rate-limit
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cloudflare Turnstile (optional in dev; required in prod for abuse control)
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Kill switch — set to "true" to pause the duel
DUEL_PAUSED=

NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 5: Full build + test to verify nothing broke**

Run: `npm run build && npm test`
Expected: build succeeds with only the duel routes (`/`, `/duel`, `/r/[shareId]`, `/og/[shareId]`, `/api/duel/avatar`, `/api/duel/verdict`); all vitest tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(duel): strip offsite multiplayer surfaces (Pusher/facilitator/projector/team)"
```

### Task 18: Update README & disclaimer

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite the README intro + URLs + tech stack**

Replace the top section of `README.md` (the title, intro paragraph, Tech stack list, and the URLs table) so it describes **Beat AXIOM**: a solo ~5-min AI sales duel judged by AXIOM (an AI by Rahul Kothari), producing a shareable LinkedIn scorecard. Tech stack: Next.js 14, Anthropic Claude, Upstash Redis, @vercel/og, Cloudflare Turnstile. URLs table: `/` (landing), `/duel` (play), `/r/[shareId]` (scorecard), `/og/[shareId]` (card image). Remove all Pusher / facilitator / projector / team references. Keep the existing fictional-content disclaimer block.

- [ ] **Step 2: Build to confirm nothing references removed pages**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(duel): rewrite README for Beat AXIOM"
```

---

## Self-Review (completed during planning)

**Spec coverage:** §2 journey → Tasks 15–16; §3 scenarios → Task 3; §4 rubric/verdict → Tasks 4, 8, 12; §5 artifact/OG/share → Tasks 6, 13, 14; §6 architecture/routes/state → Tasks 9, 11, 12; §7 cost/abuse → Tasks 1, 10, 11, 12 (turn cap, rate-limit, Turnstile, kill-switch); §8 brand safety → roast guide in Task 8, disclaimer in Tasks 16, 18; §9 MVP cut → no leaderboard/voice/accounts tasks (v2 deferred). All covered.

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". All code blocks are complete; all 3 scenarios written in full.

**Type consistency:** `Verdict`, `VerdictDimensions`, `DuelSession`, `DuelMessage`, `ScenarioId` defined once in Task 2 and used verbatim in Tasks 4, 6, 8, 9, 11, 12, 14, 15. `saveSession`/`getSession` signatures match between store (Task 9) and consumers (Tasks 12, 13, 14). `buildBuyerPrompt(scenario, turnNumber)` and `buildAxiomVerdictPrompt(scenario)` match between definition (Tasks 7, 8) and call sites (Tasks 11, 12). Rubric dimension keys (`discovery/signal/objection/value/listening`) consistent across Tasks 2, 4, 8.

**Known follow-ups for the plan executor (not blockers):**
- Wire the Turnstile widget into the play UI (Task 15) once `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set — v1 server-side verify already no-ops without a secret, so this is a prod-hardening step.
- Seed the percentile sorted sets with internal playthroughs before public launch (spec §10) — operational, not code.
