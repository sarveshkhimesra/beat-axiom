# Beat AXIOM

A single-player AI sales duel — one fictional buyer, seven questions, one shot to win the deal. Then **AXIOM**, an AI evaluator built by Rahul Kothari, scores you, roasts you, and hands you a shareable scorecard. Built to be played solo on the web and shared on LinkedIn.

> Spun out of "The Deal" — an in-room, 5-team offsite sales game — distilled into a solo, async, public experience with neutral (non-payments) sales scenarios.

> **Disclaimer**
> This is a fictional sales-training simulation built as a personal/learning project. All companies, brands, people, buyers, and scenarios in this repository are **invented for the game** and do **not** represent any real company's data, strategy, or plans. "AXIOM" is a fictional AI character. Any resemblance to real organizations or individuals is coincidental. This project is not affiliated with, endorsed by, or representing the views of any real company.

## How it works

1. **Pick a scenario** — one of three neutral B2B sales situations (a skeptical VP, a cost-cutting CFO, a committee gatekeeper). Each buyer has a hidden priority to uncover and a signature objection to handle.
2. **Run the duel** — a short text conversation with the AI buyer (turn-capped). They make you earn the insight.
3. **Face AXIOM** — it scores your discovery, signal-detection, objection handling, value framing, and listening (0–100), assigns a title and a percentile, and delivers a verdict.
4. **Share** — your scorecard unfurls as a rich image on LinkedIn, with pre-filled post copy that tags Rahul.

## Tech stack

- **Next.js 14** (App Router) — pages + API routes
- **Anthropic Claude** via **Razorpay's LiteLLM gateway** — the AI buyer and AXIOM's scoring
- **Upstash Redis** — session storage, percentile distribution, rate-limiting
- **@vercel/og** — scorecard share image
- **Cloudflare Turnstile** — abuse protection
- **Tailwind CSS** — styling
- **vitest** — unit tests for scoring/percentile/share logic

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in LiteLLM + Upstash values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables (see `.env.example`): `LITELLM_BASE_URL`, `LITELLM_API_KEY`, model names (`DUEL_AVATAR_MODEL`, `DUEL_VERDICT_MODEL`), `UPSTASH_REDIS_REST_*`, optional `TURNSTILE_*`, and `DUEL_PAUSED` (kill switch).

## URLs

| Page | URL |
|---|---|
| Landing | `/` |
| Play the duel | `/duel` |
| Shared scorecard | `/r/[shareId]` |
| Scorecard image | `/og/[shareId]` |

## Project structure

```
src/
  app/            Next.js App Router pages + API routes (/duel, /r, /og, /api/duel/*)
  lib/duel/       Duel logic — scenarios, rubric, prompts, scoring, store, share text
```

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run start    # run the built app
npm run lint     # lint
npm test         # unit tests
```

