# Beat AXIOM v2 — Design Spec

## Summary

Upgrade Beat AXIOM from a 3-scenario, turn-limited, harsh-tone sales game into a 5-scenario, time-limited, playful game optimized for mobile and viral sharing on LinkedIn/Twitter.

## Changes

### 1. 7-Minute Timer + Early End Mechanic

**Timer:**
- Visible countdown in the play phase header, alongside the turn counter.
- Starts at 7:00 when the duel begins.
- At 0:30 remaining: timer pulses red, AXIOM interjects: `[axiom] 30 seconds — wrap it up or I'm calling it.`
- At 0:00: auto-triggers verdict (same flow as running out of turns).
- Timer is client-side (no server dependency). Stored as `startedAt` timestamp; remaining = `420s - (now - startedAt)`.

**Turn limit stays at 7** — whichever limit hits first (time or turns) triggers the verdict.

**Early end on vague questions:**
- The verdict/avatar API response includes a `vague: boolean` field. Detected by the LLM via the buyer system prompt (buyer already nudges on vague questions — we formalize the signal).
- Client tracks consecutive vague count.
- After 2 consecutive vague questions: AXIOM interjects `[axiom] I'm losing interest... ask something worth my time.`
- After 3 consecutive vague questions: AXIOM ends the meeting `[axiom] meeting over. you wasted the room.` → auto-triggers verdict.
- A single non-vague question resets the counter.

### 2. Tone Shift — Game-Show Energy

**Homepage copy:**
- Replace "Most people score under 50" with something inviting: "One buyer. Seven minutes. Can you close the deal?"
- Framing is challenge/fun, not threat/failure.

**AXIOM hooks during play:**
- Keep existing encouraging hooks ("nice probe", "you're onto something").
- Add timer-aware hooks: "clock's ticking — make it count."

**Verdict & roast style:**
- Update `axiomPrompt.ts` to instruct: "Be witty and teasing, never cruel. Think game-show host, not drill sergeant."
- Always include one genuine compliment alongside the roast.
- Titles stay fun (The Closer, Happy Ears, The Brochure) — they're shareable.
- Low scores should still feel fun to share: "you charmed nobody but yourself" > "you wasted everyone's time."

**Scorecard page:**
- Fun to share at any score. The roast makes people laugh, not cringe.

### 3. 5 Scenarios with Homepage Visibility

**Homepage restructure:**
- Keep the AXIOM intro section (avatar + headline + subtext) at the top.
- Below: "Choose Your Buyer" section with 5 scenario cards.
- Each card: title + 3 relatable description lines + click-to-start.
- Clicking a card navigates directly to `/duel?scenario={id}` and starts play immediately (skip the pick phase).
- Remove the separate pick phase from DuelClient — if no `?scenario` param, show cards inline.

**Card content (3 lines each — relatable, conversational, pull the player in):**

1. **The Skeptical VP** — She's been burned before. That rollout you remind her of? It was hers. She talks ROI but what she really needs is a visible win — fast. Convince her this time is different.

2. **The Cost-Cutting CFO** — He says it's about cost. It's not. Under the spreadsheet armor, he wants to look innovative to the board. Find the real story behind the budget talk.

3. **The Committee Gatekeeper** — She'll smile, take notes, and route you to "the process." The real decision-maker isn't in the room. Figure out who is — and sell through her.

4. **The Enthusiastic Champion** (NEW) — He loves your product. He's your biggest fan internally. But he can't sign anything. The challenge: leverage his energy to reach the actual decision-maker without stepping on his toes.

5. **The Silent Technical Evaluator** (NEW) — She barely speaks. Vague claims get silence. Hand-waving gets a raised eyebrow. The only thing that earns engagement is proof and specifics.

### 4. New Scenarios — Full Data

**Scenario 4: The Enthusiastic Champion**
- `id`: `enthusiastic-champion`
- `buyer`: Ethan Morales, Senior Product Manager
- `product`: a workflow-automation platform
- `sellerStrength`: intuitive UX — teams adopt it without training
- `sellerWeakness`: limited enterprise security certifications (SOC2 pending)
- `personality`: Energetic, talkative, wants to help you win. Drops names of internal stakeholders freely. Gets visibly excited about features. But subtly deflects when asked about budget or sign-off authority.
- `surfacePains`: 1) Manual handoffs between teams cause 2-day delays 2) He personally built spreadsheet workarounds that break constantly 3) His team loves the idea of automation but "leadership hasn't prioritized it"
- `hiddenPriority`: Ethan has no purchase authority. His VP (who he mentions casually) is the actual buyer, and she's skeptical of Ethan's "shiny object" tendency. Ethan needs a way to present this as HER strategic win, not his pet project.
- `hiddenPriorityHintTopics`: who actually signs off, what happened to Ethan's last recommendation, the VP's priorities, how purchase decisions work here
- `signatureObjection`: "Look, I'm totally sold — but my VP is going to ask why we need another tool when we just bought [competitor]. I need you to help me answer that."
- `budgetSignal`: Budget exists at the VP level for "strategic ops investments" — but Ethan can't access it directly. He needs ammunition, not approval.

**Scenario 5: The Silent Technical Evaluator**
- `id`: `silent-evaluator`
- `buyer`: Dr. Lena Karim, Principal Engineer
- `product`: a developer-infrastructure platform
- `sellerStrength`: 10x faster CI/CD pipelines — proven benchmarks
- `sellerWeakness`: requires migration effort from existing toolchain
- `personality`: Laconic. Responds in 1-2 sentences max. Never asks clarifying questions — just waits. Visibly unimpressed by marketing language. Warms up ONLY to specifics, benchmarks, architecture details, and honest trade-off admissions.
- `surfacePains`: 1) Current CI takes 45 minutes; developers context-switch and lose flow 2) The team has outgrown their Jenkins setup but nobody wants to own migration 3) On-call is painful because deploy rollbacks are manual and slow
- `hiddenPriority`: Lena's team lost their best engineer last month — partly because the tooling was embarrassing. She needs to show the remaining team that leadership is investing in developer experience. It's a retention play disguised as an infrastructure upgrade.
- `hiddenPriorityHintTopics`: team morale, recent departures, what the team actually complains about, developer experience as retention
- `signatureObjection`: "What's the migration path? We're not rewriting our pipeline configs for a marginal improvement."
- `budgetSignal`: Budget is pre-approved for "platform modernization" but Lena will reject anything that creates more work for her already-stretched team. The pitch must be low-migration-effort.

### 5. Remove Voice Transcription

**Delete:**
- `src/lib/duel/useSpeech.ts`
- `src/lib/duel/transcript.ts`
- `src/lib/duel/transcript.test.ts`

**Modify:**
- `DuelClient.tsx`: Remove all `speech` references, mic button, recording UI, listening state.
- Input becomes text-only: type + press Enter or click Send.
- Placeholder text: "type your question..."

### 6. Mobile Responsive

**Conversation area:**
- Full viewport width on mobile (remove max-width constraint on small screens).
- Messages: larger font (16px min), adequate line-height.
- Touch targets: minimum 44px hit area on all buttons.

**Input area:**
- Sticky at viewport bottom on mobile (position: sticky, bottom: 0).
- Send button: larger, thumb-friendly (44x44px minimum).

**Timer:**
- Always visible in the sticky header bar — compact format "4:32" alongside turn counter.

**Scenario cards (homepage):**
- Single column on mobile, full-width cards.
- Adequate padding and tap targets.

**Share buttons (scorecard):**
- Full-width stack on screens < 480px.

**General:**
- Add viewport meta tag if missing.
- Test breakpoints: 375px (iPhone SE), 390px (iPhone 14), 768px (tablet).

### 7. Type Updates

Update `ScenarioId` type to include new IDs:
```typescript
export type ScenarioId = "skeptical-vp" | "cutting-cfo" | "committee-gatekeeper" | "enthusiastic-champion" | "silent-evaluator";
```

### 8. Config Updates

```typescript
export const MAX_PLAYER_TURNS = 7; // unchanged
export const DUEL_DURATION_SECONDS = 420; // 7 minutes
export const DUEL_WARNING_SECONDS = 30; // warning at 30s remaining
export const VAGUE_QUESTION_LIMIT = 3; // end meeting after 3 consecutive vague
```

## Files Changed

| File | Action |
|------|--------|
| `src/app/page.tsx` | Rewrite — add scenario cards section |
| `src/app/duel/DuelClient.tsx` | Major rewrite — timer, remove speech, mobile layout, vague-question tracking |
| `src/lib/duel/scenarios.ts` | Add 2 new scenarios |
| `src/lib/duel/types.ts` | Update ScenarioId union |
| `src/lib/duel/config.ts` | Add timer/vague constants |
| `src/lib/duel/avatarPrompt.ts` | Add vague-detection signal instruction |
| `src/lib/duel/axiomPrompt.ts` | Tone shift to game-show energy |
| `src/app/api/duel/avatar/route.ts` | Return `vague` boolean in response |
| `src/app/globals.css` | Mobile responsive styles, timer pulse animation |
| `src/lib/duel/useSpeech.ts` | DELETE |
| `src/lib/duel/transcript.ts` | DELETE |
| `src/lib/duel/transcript.test.ts` | DELETE |
| `src/lib/duel/shareText.ts` | Update share copy tone |

## Out of Scope

- Server-side timer enforcement (client-side is fine for a game)
- New scoring dimensions (keep existing 5-dimension rubric)
- Sound effects changes
- OG image redesign
- Redis/persistence changes
