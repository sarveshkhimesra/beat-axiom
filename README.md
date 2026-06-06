# The Deal

A real-time, AI-powered competitive sales simulation game for offsite events. Five teams compete to win a payments deal from a fictional enterprise customer, judged by an AI persona (AXIOM). Built for a live group setting with separate devices for each team, a facilitator, and a projector display.

See [`THE_DEAL_SPEC.md`](./THE_DEAL_SPEC.md) for the full product spec.

> **Disclaimer**
> This is a fictional sales-training simulation built as a personal/learning project. All companies, brands, people, customers, pricing, numbers, and scenarios in this repository are **invented for the game** and do **not** represent any real company's data, strategy, pricing, or plans. Any resemblance to real organizations or individuals is coincidental. This project is not affiliated with, endorsed by, or representing the views of any real company.

## Tech stack

- **Next.js 14** (App Router) — frontend + API routes
- **Anthropic Claude API** — AI persona and scoring
- **Pusher** — real-time sync across devices
- **Upstash Redis** — session state persistence
- **Tailwind CSS** + **Framer Motion** — styling and animation
- **Web Speech API** — push-to-talk and TTS

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your own keys:

```bash
cp .env.example .env.local
```

You'll need accounts on:

- [Anthropic](https://console.anthropic.com) — for `ANTHROPIC_API_KEY`
- [Pusher](https://pusher.com) — for `PUSHER_*` keys (free tier is fine)
- [Upstash](https://upstash.com) — for `UPSTASH_REDIS_*` (free tier is fine)

Optionally, you can use Azure-hosted Claude by setting `AZURE_ANTHROPIC_*` instead of `ANTHROPIC_API_KEY`.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## URLs

| Role | URL |
|---|---|
| Landing / role picker | `/` |
| Team player | `/team/[teamId]` |
| Facilitator | `/facilitator` |
| Projector display | `/projector` |
| End-of-game summary | `/summary` |

## Project structure

```
src/
  app/            Next.js App Router pages + API routes
  lib/            Shared logic (Anthropic, Pusher, Redis, scoring, types)
```

## Deployment

Deployed to Vercel. Pushing to `main` triggers an automatic deploy when the GitHub repo is linked to a Vercel project.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run start    # run the built app
npm run lint     # lint
```
