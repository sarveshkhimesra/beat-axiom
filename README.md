# Beat AXIOM

An AI-powered sales duel. One fictional buyer, seven questions, one shot to win the deal — then **AXIOM** scores you, roasts you, and hands you a shareable scorecard.

**[Play it live →](https://beat-axiom.vercel.app)**

![Beat AXIOM screenshot](https://beat-axiom.vercel.app/og/a4ijG8TAfr)

---

## What is this?

A solo, async, browser-based sales simulation game. You get dropped into a realistic B2B sales conversation with an AI buyer who has:
- **Surface pains** you need to uncover through sharp questions
- A **hidden priority** (guarded — you must earn the reveal through pointed probing)
- A **signature objection** dropped mid-conversation that you must handle

After 7 questions, **AXIOM** — the AI evaluator — reads your transcript and delivers a verdict: a score (0–100), a title ("Closer", "Happy Ears", "The Brochure"...), and a brutal-but-fair roast.

The scorecard unfurls as a rich image when shared on LinkedIn/X, designed for organic viral sharing.

## Scenarios

Three neutral B2B scenarios (no domain expertise required):

| Scenario | Buyer | The challenge |
|---|---|---|
| **The Skeptical VP** | Dana Whitfield, VP Ops | Burned by a past rollout. Her hidden driver is personal credibility, not ROI. |
| **The Cost-Cutting CFO** | Marcus Lee, CFO | Talks cost, but secretly wants to look innovative to the board. |
| **The Committee Gatekeeper** | Priya Nandakumar, Head of Procurement | Process-driven deflector. The real force is an absent exec sponsor. |

## How AXIOM scores

100 points across 5 dimensions:

| Dimension | Points | What earns full marks |
|---|---|---|
| Discovery depth | 25 | Uncovers real pain beyond the surface |
| Hidden-priority detection | 25 | Earns a reveal of the buried priority |
| Objection handling | 25 | Acknowledges, reframes, backs with evidence |
| Value framing | 15 | Anchors on outcomes, quantifies |
| Listening & adaptiveness | 10 | Picks up signals and pivots |

**Penalties:** generic questions (-5 each), pitching before discovering (-10), deflecting the objection (-10).

See [`docs/AXIOM-Rating-Mechanism.md`](docs/AXIOM-Rating-Mechanism.md) for the full scoring spec.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| AI | Anthropic Claude (via any OpenAI-compatible proxy, direct API, or Azure) |
| State | Upstash Redis (sessions + rate-limiting) — optional in dev (falls back to in-memory) |
| OG images | @vercel/og |
| Abuse protection | Cloudflare Turnstile (optional) + IP rate-limiting |
| Styling | Tailwind CSS |
| Testing | vitest |
| Deployment | Vercel (or any Node.js host) |

## Getting started

### Prerequisites

- Node.js 18+
- An Anthropic-compatible API endpoint (direct Anthropic, Azure, LiteLLM, OpenRouter, etc.)

### Install & run

```bash
git clone https://github.com/sarveshkhimesra/beat-axiom.git
cd beat-axiom
npm install
cp .env.example .env.local   # fill in your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](.env.example) for all options. The minimum to run locally:

```bash
# Option A: Direct Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Option B: Azure-hosted Anthropic
AZURE_ANTHROPIC_ENDPOINT=https://your-resource.services.ai.azure.com/anthropic/
AZURE_ANTHROPIC_API_KEY=your-key
AZURE_ANTHROPIC_MODEL=your-deployment-name

# Option C: LiteLLM / OpenAI-compatible proxy
LITELLM_BASE_URL=https://your-proxy.example.com
LITELLM_API_KEY=your-key
```

Redis is **optional for local dev** — without Upstash keys, sessions are stored in-memory (reset on restart). For production, add:

```bash
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## Project structure

```
src/
├── app/
│   ├── page.tsx              Landing page
│   ├── duel/                 Play interface (scenario pick + conversation)
│   ├── r/[shareId]/          Public scorecard page (OG meta + share buttons)
│   ├── og/[shareId]/         OG image generation (scorecard card)
│   └── api/duel/
│       ├── avatar/route.ts   Buyer conversation turn
│       └── verdict/route.ts  AXIOM scoring endpoint
├── components/
│   └── AxiomAvatar.tsx       Animated geometric AI avatar (SVG)
└── lib/
    ├── anthropic.ts          AI client (multi-provider: LiteLLM → Azure → direct)
    └── duel/
        ├── types.ts          Domain types
        ├── scenarios.ts      The 3 scenarios (data)
        ├── config.ts         Constants (turn limit, model names, kill switch)
        ├── rubric.ts         Scoring rubric, title bands, verdict parser
        ├── avatarPrompt.ts   Buyer system prompt (controls difficulty)
        ├── axiomPrompt.ts    AXIOM verdict prompt (scoring + roast style)
        ├── store.ts          Session persistence (Redis or in-memory)
        ├── ratelimit.ts      Rate-limiting + Turnstile
        ├── percentile.ts     Percentile math
        ├── shareText.ts      LinkedIn/X share copy builder
        ├── sfx.ts            Web Audio sound effects
        └── useSpeech.ts      Voice input (Web Speech API)
```

## Customization

| To change... | Edit this file |
|---|---|
| How hard AXIOM scores | `src/lib/duel/rubric.ts` |
| AXIOM's personality & roast style | `src/lib/duel/axiomPrompt.ts` |
| How the buyer guards information | `src/lib/duel/avatarPrompt.ts` |
| Scenarios (buyers, pains, objections) | `src/lib/duel/scenarios.ts` |
| Turn limit | `src/lib/duel/config.ts` → `MAX_PLAYER_TURNS` |
| UI / terminal theme | `src/app/globals.css` |
| Share text template | `src/lib/duel/shareText.ts` |

## Scripts

```bash
npm run dev        # local dev server (hot reload)
npm run build      # production build
npm run start      # run production build
npm run lint       # ESLint
npm test           # unit tests (vitest)
npm run test:watch # tests in watch mode
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy — every push to `main` auto-deploys

### Other hosts

Any Node.js 18+ host that supports Next.js works. Set the same env vars and run:

```bash
npm run build && npm run start
```

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Ensure tests pass (`npm test`) and build succeeds (`npm run build`)
5. Commit with a clear message
6. Open a Pull Request

### Adding a new scenario

Add an entry to the `SCENARIOS` object in `src/lib/duel/scenarios.ts`. Each scenario needs:
- A buyer (name, role, personality)
- 3 surface pains
- A hidden priority + hint topics
- A signature objection
- A budget signal

Run `npm test` to verify the scenario passes validation (domain-neutral, no missing fields).

## License

[MIT](LICENSE) — built by Rahul Kothari.

## Disclaimer

This is a fictional sales-training simulation. All companies, brands, buyers, and scenarios are invented for the game and do not represent any real organization. "AXIOM" is a fictional AI character.
