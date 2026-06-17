# Beat AXIOM — Design Spec

**Date:** 2026-06-15
**Status:** Approved shape, pending spec review
**Author:** Sarvesh Khimesra (COO's Office) with Claude

> **Disclaimer (carried from the original game):** This is a fictional sales-training simulation. All companies, buyers, scenarios, pricing, and numbers are invented for the game and do not represent any real organization. "AXIOM" is a fictional AI character. Not affiliated with or representing any real company.

---

## 1. Purpose & Positioning

**What we're building:** A single-player, async, public web game that distills the offsite hit "The Deal" into a ~5-minute solo sales duel against an AI buyer, judged by **AXIOM** — a sharp, funny AI evaluator **built and trained by Rahul Kothari**. The player walks away with a scored, roast-laced **scorecard** designed to be posted on LinkedIn, where tagging Rahul is the organic, natural move.

**Why it's different from the offsite version:**

| | Offsite "The Deal" | Beat AXIOM (this) |
|---|---|---|
| Players | 5 teams, co-located | 1 player, anywhere |
| Sync | Real-time, 7 devices, Pusher | Async, 1 device, no live sync |
| Facilitator | Required | None |
| Duration | ~60 min | ~5 min |
| Domain | Payments-specific (internal) | **General B2B sales** (public) |
| Goal | Training + drama in a room | **Viral LinkedIn loop centred on Rahul** |

**Strategic frame (the 3 locked decisions):**
1. **Format:** one tight ~5-min solo duel → AXIOM verdict → shareable scorecard.
2. **Loop:** the AXIOM *roast* is the bait; AXIOM is **Rahul's AI** (not Razorpay's); everything centres on Rahul's positioning as the creator.
3. **Persona:** AXIOM keeps its distinct geeky-AI identity, explicitly "built & trained by Rahul Kothari." Rahul is the visible creator/curator (not the bot's literal voice).

**Non-goals (v1):** multiplayer, accounts/login, voice, a public leaderboard, "beat Rahul's score." All deferred to v2.

---

## 2. The Single Session (player journey)

1. **Land (`/`)** — punchy hook. Sample copy:
   > *"AXIOM doesn't do small talk. Rahul Kothari trained an AI to grade sales conversations the way he does — ruthlessly. Most people score under 5/10. You've got 5 minutes. [Take the duel]"*
2. **Scenario assignment (`/duel`)** — player is dropped into one of **3 neutral scenarios** (random, or pick). They're told: the product they're selling (with one strength + one weakness to own), who they're talking to, and the rules: *"~7 messages. Win the deal. Go."*
3. **The duel** — text conversation with the **AI Customer Avatar**. The buyer makes you earn insight, guards a **hidden priority**, and lands a **signature objection** partway through. Hard cap of **7 player turns** (also a soft 5-min timer). Streaming responses for snappiness.
4. **The verdict** — dramatic reveal. AXIOM scores you (0–100), assigns a **percentile** and a **title**, quotes your **best line** and **worst line**, and delivers one **savage-but-fair roast** paragraph in its voice.
5. **Share** — gorgeous scorecard + one-tap **"Share on LinkedIn"** (pre-filled, editable post text that @-tags Rahul + a challenge link) and **"Try another scenario."**

---

## 3. Content — 3 Neutral Scenarios

The methodology is universal; only the data is new. Each scenario mirrors the original structure (sell-side brief + buyer with surface pain, a buried priority, a signature objection, a budget signal) but is **domain-light** so any salesperson sees themselves. No specialist knowledge required — pure sales skill.

**Scenario A — "The Skeptical VP"**
- *You sell:* a team-productivity platform. Strength: fast time-to-value. Weakness: thin enterprise track record.
- *Buyer:* VP of Operations, burned by a past tool rollout that died in adoption.
- *Hidden priority:* she needs a visible **internal political win**, not just ROI — her last project failed and her credibility is on the line.
- *Signature objection:* *"We tried something like this two years ago. Adoption cratered in a month. Why is this any different?"*

**Scenario B — "The Cost-Cutting CFO"**
- *You sell:* a managed-service / consulting engagement. Strength: senior team. Weakness: premium price.
- *Buyer:* CFO under board pressure to cut spend.
- *Hidden priority:* actually wants to look **innovative to the board**, not merely cheap — "cost story" is the cover, "transformation story" is the real want.
- *Signature objection:* *"Your competitor quoted us 30% less for what looks like the same thing."*

**Scenario C — "The Committee Gatekeeper"**
- *You sell:* an enterprise software platform. Strength: deep integrations. Weakness: longer onboarding.
- *Buyer:* a procurement-minded gatekeeper running a formal evaluation.
- *Hidden priority:* there's an **absent executive champion** whose mandate is the true driver; the gatekeeper won't surface them unless pushed well.
- *Signature objection (the brush-off):* *"Just send over a proposal and we'll get back to you."*

Each scenario's buyer brief lives in a typed content file (mirrors `lib/content/customers.ts` shape). Adding scenarios later = adding data, no code change.

---

## 4. The Verdict — Compressed Rubric

A single-conversation rubric distilled from the original 4-stage framework. **100 points.**

| Dimension | Pts | Full marks |
|---|---|---|
| Discovery depth | 25 | Uncovers real pain + who's affected, beyond surface |
| Hidden-priority detection ("the signal") | 25 | Earns a partial/full reveal of the buried priority |
| Objection handling | 25 | Acknowledges → reframes → backs with evidence → moves forward |
| Value framing | 15 | Anchors on value/outcome, quantifies where possible |
| Listening & adaptiveness | 10 | Picks up buyer signals and pivots vs running a script |

**Penalties:** generic questions ("what are your goals?") −5 each; pitching before discovering −10; deflecting the objection −10.

**Verdict output (JSON from AXIOM):**
```json
{
  "score": 62,
  "title": "Happy Ears",
  "percentile": 73,
  "dimensions": { "discovery": 16, "signal": 10, "objection": 18, "value": 11, "listening": 7 },
  "bestLine": "What did the last rollout cost you in credibility, not just dollars?",
  "worstLine": "So, what keeps you up at night?",
  "roast": "You found the bruise and then asked about the weather. AXIOM watched you tee up the perfect follow-up and bunt it into the parking lot...",
  "didDetectSignal": true,
  "didHandleObjection": false
}
```

**Title bank (examples, mapped to score bands + behavior):** `Closer` (top), `Operator`, `Happy Ears`, `Spray-and-Pray Merchant`, `The Brochure` (pitched too early), `Hostage` (got steamrolled). AXIOM picks the title that best fits the *behavior*, not just the score band.

---

## 5. The Viral Artifact & Loop (the crux)

**Scorecard image (OG):** auto-generated via `@vercel/og` at `/api/og/[shareId]`. Dark, sharp, AXIOM-branded. Contains: score, title, percentile, the single funniest AXIOM line, scenario name, and **"AXIOM — an AI by Rahul Kothari."**

**Link unfurl:** the share page `/r/[shareId]` carries OG/Twitter meta pointing at that image, so **posting the link on LinkedIn unfurls into the scorecard**. This is the core viral mechanic — the preview *is* the artifact.

**Pre-filled LinkedIn post (editable):**
> *"AXIOM — the AI @Rahul Kothari built to grade sales conversations — gave me a **62/100**. Apparently my discovery was 'a hostage negotiation run by the hostage.' 😅 Think you can beat me? 👇 [link]"*

(`@Rahul Kothari` is pre-typed text the user keeps when posting; LinkedIn resolves the mention on their end. We provide the copy + link; the user posts from their own account.)

**Why the loop turns:**
- AXIOM being *Rahul's* AI makes tagging him organic — attribution + "your AI is brutal, Rahul."
- The roast is humble-brag gold — self-deprecating + impressive = the LinkedIn sweet spot.
- **Rahul amplifies:** he comments on / reposts standout scores, which rewards tagging him → more plays → more posts. This human-in-the-loop step is what closes the cycle; it's a content habit, not a build task.
- `/r/[shareId]` always CTAs "Take the duel" → every shared post is a funnel back in.

---

## 6. Architecture

**Approach: lean fork of the existing repo.** Delete the multiplayer machinery (Pusher, facilitator, projector, 5-team logic). Reuse `lib/anthropic.ts`, `lib/axiom.ts`, `lib/scoring.ts`, the aesthetic/components, and the content-file pattern. The disposable part is the sync layer; the gold (personas, rubric, look) is already isolated in `lib/`.

**Routes:**
- `/` — hook landing
- `/duel` — play surface (scenario assignment + conversation + verdict)
- `/r/[shareId]` — public scorecard page (OG meta + "Take the duel" CTA)
- `/api/avatar` — one Customer Avatar turn (streaming; **cheap fast model**)
- `/api/verdict` — AXIOM scoring at duel end (**stronger model**, JSON out)
- `/api/og/[shareId]` — scorecard image (`@vercel/og`)

**State:** minimal, no live sync. On verdict, persist the completed session to **Upstash Redis** keyed by `shareId` (nanoid): `{ score, title, percentile, dimensions, bestLine, worstLine, roast, scenarioId, createdAt }`. Percentile computed from a running score distribution (Redis sorted set per scenario).

**Models:** avatar turns use a cheap/fast Claude model (volume path); the single verdict call uses a stronger model for judgment quality. Both via the existing `lib/anthropic.ts` client (Anthropic API directly, per the repo; Azure path already supported as fallback).

**Removed env/deps:** all `PUSHER_*`, `pusher`, `pusher-js`. Kept: `ANTHROPIC_*`, `UPSTASH_REDIS_*`. Added: `@vercel/og`, `nanoid`, a rate-limiter (`@upstash/ratelimit`), Cloudflare Turnstile keys.

---

## 7. Cost & Abuse Control (public LLM tool — the #1 operational risk)

Baked into v1:
- **Hard turn cap** per duel (7 player turns → ≤8 avatar calls + 1 verdict call). Bounded cost per session.
- **Per-IP rate limit** (`@upstash/ratelimit`) on duel start + **Cloudflare Turnstile** challenge before the first call.
- **Cheap model** for the many avatar turns; one stronger call only for the verdict.
- **Daily global spend cap** with a kill-switch env flag (`DUEL_PAUSED=true` shows a "AXIOM is resting" page).
- Input length cap (300 chars/turn, carried from the original) — limits token cost and forces real conversation.

---

## 8. Brand Safety

- Keep the **fictional disclaimer** prominent (companies/buyers/AXIOM are invented).
- **Fully Rahul-personal:** footer is "AXIOM, an AI by Rahul Kothari." No Razorpay marks. (Already consistent with the public repo's personal-project framing.)
- **Rahul signs off on AXIOM's tone** before launch: savage and funny, but never offensive, identity-based, or punching down. One reviewed "roast style guide" line in the AXIOM system prompt.

---

## 9. MVP Cut (v1) vs Later

**v1 (this spec):** 3 neutral scenarios · text-only duel · AXIOM verdict (score/title/percentile/roast) · scorecard OG image · LinkedIn share with @Rahul prefilled · cost/abuse guards · fictional disclaimer + Rahul footer.

**v2 (not now):** public leaderboard · "beat Rahul's own score" benchmark · weekly themed scenarios · voice (Web Speech) · challenge-a-colleague tracking · more scenarios.

---

## 10. Open Questions for Plan Stage

- Exact AXIOM "roast style guide" wording (needs Rahul's sign-off).
- Final title bank + score-band → title mapping.
- Hosting/domain (Vercel; a Rahul-personal domain vs subpath).
- Whether to seed the percentile distribution with internal playthroughs before public launch (avoids "you beat 100% of players" on day one).
