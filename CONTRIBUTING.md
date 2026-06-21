# Contributing to Beat AXIOM

Thanks for your interest in contributing! Here's how to get started.

## Development setup

```bash
git clone https://github.com/sarveshkhimesra/beat-axiom.git
cd beat-axiom
npm install
cp .env.example .env.local   # fill in at least one AI provider
npm run dev
```

## Before submitting a PR

1. **Tests pass:** `npm test`
2. **Build succeeds:** `npm run build`
3. **Lint clean:** `npm run lint`

## Architecture overview

The app is a Next.js 14 App Router project. Key areas:

- **`src/lib/duel/`** — all game logic (pure TypeScript, no framework dependency). This is where scenarios, prompts, scoring, and session management live.
- **`src/app/api/duel/`** — two API routes: `avatar` (buyer conversation turn) and `verdict` (AXIOM scoring).
- **`src/app/`** — pages (landing, duel play, scorecard, OG image).
- **`src/lib/anthropic.ts`** — the AI client. Supports Azure-hosted Anthropic and direct Anthropic API.

## Adding a scenario

1. Open `src/lib/duel/scenarios.ts`
2. Add a new entry to the `SCENARIOS` object (follow the existing pattern)
3. Add the new ID to the `ScenarioId` type in `src/lib/duel/types.ts`
4. Run `npm test` — the scenario test validates completeness and domain-neutrality

Each scenario needs:
- `id`, `title`, `product`, `sellerStrength`, `sellerWeakness`, `setup`
- A `buyer` with: `name`, `role`, `personality`, `surfacePains` (3), `hiddenPriority`, `hiddenPriorityHintTopics` (3+), `signatureObjection`, `budgetSignal`

## Tuning difficulty

- **Buyer behavior** (how hard they guard info): `src/lib/duel/avatarPrompt.ts`
- **Scoring rubric** (dimension weights, penalties, title bands): `src/lib/duel/rubric.ts`
- **AXIOM personality** (roast style, verdict format): `src/lib/duel/axiomPrompt.ts`

## Code style

- TypeScript strict mode
- No comments unless the WHY is non-obvious
- Pure functions for game logic (easy to test)
- Each file has one responsibility

## Issues & feature requests

Open a GitHub issue. For bugs, include: what you did, what happened, what you expected.
