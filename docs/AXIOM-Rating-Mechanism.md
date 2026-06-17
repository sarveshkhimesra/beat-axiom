# AXIOM Rating Mechanism — How the AI Judges

**Beat AXIOM** | Built by Rahul Kothari

---

## Overview

AXIOM scores every player on a **100-point rubric** across 5 dimensions, then assigns a **title** (like "Closer" or "Happy Ears"), a **percentile** (how they rank vs all players), quotes their **best and worst line**, and delivers a **2–3 sentence roast** in AXIOM's voice.

The scoring is designed so that **most people score under 50** — because most salespeople default to generic questions, pitch too early, or fumble the hard objection. A score of 85+ ("Closer") requires genuine elite technique.

---

## The 5 Scoring Dimensions (100 points total)

| # | Dimension | Max Points | Full marks when... |
|---|---|---|---|
| 1 | **Discovery depth** | 25 | Uncovers real pain and who it affects, well beyond the surface |
| 2 | **Hidden-priority detection ("the signal")** | 25 | Earns a partial or full reveal of the buyer's buried priority |
| 3 | **Objection handling** | 25 | Acknowledges the objection, reframes it, backs with evidence, moves forward |
| 4 | **Value framing** | 15 | Anchors on value/outcome, quantifies where possible |
| 5 | **Listening & adaptiveness** | 10 | Picks up buyer signals and pivots rather than running a prepared script |

### Why these weights?

- **Discovery + Signal (50 points combined):** Elite selling is about uncovering what the buyer actually needs — not pitching features. Half the score rewards this.
- **Objection handling (25 points):** Every real deal has a hard moment. How you respond to resistance — not just what you pitch — separates closers from brochure-readers.
- **Value + Listening (25 points combined):** These reward the craft of framing and the discipline of adapting. Lower-weighted because they're harder to demonstrate fully in just 7 messages, but still meaningful.

---

## Penalties (subtracted from relevant dimensions)

| Bad habit | Penalty |
|---|---|
| Generic questions ("what are your goals?", "what keeps you up at night?") | **-5 each** |
| Pitching before discovering (jumping to your solution too early) | **-10** |
| Deflecting or ignoring the signature objection | **-10** |

### Why penalties?

These are the three most common mistakes salespeople make. The penalties ensure that *doing the wrong thing actively hurts*, rather than just failing to earn positive points. A player who asks 3 generic questions has already lost 15 points before scoring anything.

---

## Title Bands

| Score Range | Title | What it means |
|---|---|---|
| 85–100 | **Closer** | Cracked the secret, handled the objection, framed value sharply — elite |
| 70–84 | **Operator** | Solid work, maybe missed one dimension or left points on the table |
| 55–69 | **Contender** | Decent but clear gaps — probably missed the hidden priority or fumbled the objection |
| 35–54 | **Happy Ears** | Heard what they wanted to hear, missed buyer signals, surface-level |
| 0–34 | **The Brochure** | Pitched too early, ran a script, or got steamrolled |

AXIOM can also assign a **behavior-specific title** that overrides the band default if it fits better:
- **"Hostage"** — got steamrolled by the buyer
- **"Spray-and-Pray Merchant"** — threw everything at the wall
- **"The Closer"** — earned it specifically through tight execution

---

## How Difficulty Works (The Buyer's Side)

The game is hard because of how the AI buyer behaves:

### 1. Hidden Priority Guarding (controls 25% of points)

Every scenario has a **buried priority** — the buyer's real driver that they won't volunteer. The buyer is instructed:

> "GUARD this. Never raise it yourself. Only when the salesperson has clearly, specifically probed the right area across **at least TWO pointed questions** do you drop a small hint; reveal it fully only if they keep pulling that exact thread with sharp follow-ups. A generic 'what matters most to you?' gets a polite deflection, not the secret."

**Example (The Skeptical VP):**
- Hidden priority: Dana needs a visible internal WIN (her credibility is on the line after a failed rollout)
- Hint topics: the last rollout and why it failed, how success will be judged internally, Dana's own standing, adoption and change management
- A vague "what are your priorities?" → polite deflection
- "What did the last rollout cost you personally in credibility?" → gets closer
- Follow-up: "So the real win here isn't ROI, it's a visible adoption success you can show leadership?" → full reveal

### 2. Signature Objection (controls 25% of points)

At **turn 3+**, the buyer lands a pre-written hard objection:

> "LAND YOUR OBJECTION NOW: work this concern into your reply, naturally. Do not soften it — make them handle it."

**Examples:**
- VP: "We tried something identical two years ago. Adoption cratered. Why is this different?"
- CFO: "Your competitor quoted us 30% less for the exact same scope."
- Gatekeeper: "Just send a proposal and we'll get back to you."

The player must **acknowledge + reframe + provide evidence** to score. Deflecting ("let me get back to you on that") or ignoring it = 0/25 + a -10 penalty.

### 3. Surface Pain Rationing

The buyer shares pain points **one at a time**, only when questions are sharp:

> "On a vague question, give a broad answer and nudge them to ask something sharper. Make them earn the specifics."

### 4. Turn Pressure (7 questions total)

With only ~7 messages, there's no room to waste. A player who spends 3 turns on generic openers has already:
- Burned 43% of their turns
- Taken -15 in penalties (3 × -5 for generic questions)
- Left themselves too few turns to crack the hidden priority

---

## AXIOM's Personality & Roast Rules

**Who AXIOM is:** "A hedge-fund analyst who moonlights as a stand-up comedian. Dry, precise, genuinely impressed by excellence, ruthless about mediocrity."

**Roast style guide (hard rules — Rahul's name is on this):**
- Be witty and savage about the **WORK**, never the person
- Mock the move, not the human
- Never reference identity, appearance, or anything protected
- Never punch down, never be crude
- A great roast is something the player would **laugh at and proudly post**
- If it would make them feel small rather than amused → rewrite it

**Example roasts from real plays:**
- "Three messages in and you've already diagnosed her career anxiety — efficient to the point of being rude. The only smudge is tossing out 'guarantee 80% in week one' like a carnival barker."
- "You found the bruise and then asked about the weather. AXIOM watched you tee up the perfect follow-up and bunt it into the parking lot."
- "Two messages in and you sniffed out the crown jewel — genuinely surgical. Then you celebrated by sprinting straight to the punchline without bothering to quantify."

---

## What AXIOM Outputs (JSON)

After reading the full transcript, AXIOM returns exactly this:

```json
{
  "score": 72,
  "title": "Operator",
  "dimensions": {
    "discovery": 18,
    "signal": 20,
    "objection": 16,
    "value": 10,
    "listening": 8
  },
  "bestLine": "What did the last rollout cost you in credibility, not just dollars?",
  "worstLine": "So what keeps you up at night?",
  "roast": "You found the bruise and then asked about the weather...",
  "didDetectSignal": true,
  "didHandleObjection": false
}
```

---

## Tuning Knobs (for Rahul)

| To make it... | Change this |
|---|---|
| **Harder** | Raise "TWO pointed questions" → THREE in `avatarPrompt.ts`; add more penalties in `rubric.ts`; lower title band minimums |
| **Easier** | Lower threshold to ONE question; reduce penalty values; raise title band minimums |
| **Different dimensions** | Edit the `RUBRIC` array in `rubric.ts` — add/remove/reweight |
| **Different titles** | Edit `TITLE_BANDS` in `rubric.ts` |
| **Different roast tone** | Edit the "ROAST STYLE GUIDE" section in `axiomPrompt.ts` |
| **Different scenarios** | Edit `scenarios.ts` — new buyers, new hidden priorities, new objections |

---

## File Locations in the Codebase

| File | What it controls |
|---|---|
| `src/lib/duel/rubric.ts` | Points per dimension, penalties, title bands, verdict parsing |
| `src/lib/duel/axiomPrompt.ts` | AXIOM's system prompt (personality, style guide, scoring instructions) |
| `src/lib/duel/avatarPrompt.ts` | Buyer behavior (how hard they guard, when objection fires) |
| `src/lib/duel/scenarios.ts` | The 3 scenarios (buyer names, pains, hidden priorities, objections) |

---

*Built for Beat AXIOM — https://beat-axiom.vercel.app*
