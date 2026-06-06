# THE DEAL — COMPLETE BUILD SPECIFICATION
### A Real-Time AI-Powered Sales Training Game for Offsite Events
**Version:** 1.0 | **Prepared for:** Claude Code / Developer Handoff
**Status:** Approved and ready to build

> **Disclaimer:** This is a fictional sales-training simulation. All companies, brands, people, customers, pricing, and scenarios described here are invented for the game and do not represent any real company's data, strategy, or plans. Any resemblance to real organizations is coincidental.

---

## 1. PRODUCT OVERVIEW

### What Is This?
A browser-based, AI-powered competitive sales simulation game designed for a group offsite with 5 sales leaders. Five teams simultaneously compete to win a payments deal from a fictional enterprise customer. The game runs across 4 stages, one team is eliminated per stage, and the winner is decided by AI scoring. The game showcases AI capability, teaches elite sales skills, and is designed to be dramatic, fun, and memorable.

### Who Uses It?
- 5 team players — one per team, on separate laptops
- 1 facilitator — controls game flow, on a separate laptop
- 1 projector display — TV/projector URL showing leaderboard and reveals

### Where Does It Run?
Deployed on **Vercel** (or similar). 7 separate browser URLs. No login required. Session-based access.

### Core Design Principles
- AI does the heavy lifting — facilitator manages energy, not mechanics
- Every moment of tension should be visible on the projector
- Real sales behavior rewarded, not just good questions
- Drama, humor, and education in equal measure
- Geeky, sharp aesthetic — not corporate, not childish

---

## 2. TECH STACK

### Recommended Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes, SSR, real-time capability |
| Real-time sync | Pusher or Ably | Multi-device live sync without WebSocket complexity |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) | Two separate system prompts per persona |
| Voice | Web Speech API (browser-native) | Push-to-talk, no third-party dependency |
| Text-to-speech | ElevenLabs API or browser SpeechSynthesis | Avatar voice output |
| PDF generation | react-pdf or Puppeteer | End-of-game summary download |
| Hosting | Vercel | Fast deploy, environment variables, edge functions |
| State persistence | Upstash Redis (serverless) | Session state survives device refresh |
| Styling | Tailwind CSS + custom CSS variables | Geeky dark theme, fast iteration |
| Animation | Framer Motion | Avatar animations, stage transitions, score reveals |

### Environment Variables Required
```
ANTHROPIC_API_KEY=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ELEVENLABS_API_KEY= (optional, fallback to browser TTS)
NEXT_PUBLIC_BASE_URL=
```

### URL Structure
```
/facilitator          → Facilitator control panel
/projector            → Projector/TV display (separate URL)
/team/[teamId]        → Team player interface (5 URLs: team/1 through team/5)
```

---

## 3. GAME STRUCTURE AND TIMING

### Full Game Timeline (~60 minutes)
| Phase | Duration | Triggered By |
|---|---|---|
| Setup & team assignment | 5 min | Facilitator |
| AI host scoring demo | 5 min | Facilitator (projector only) |
| Company brief reading window | 5-7 min | Facilitator (timed countdown) |
| Stage 1 — Discovery | 7 min | Facilitator |
| Stage 1 reveal + elimination | 3 min | Auto (after timer) |
| Stage 2 — Needs Generation | 7 min | Facilitator |
| Stage 2 reveal + elimination | 3 min | Auto |
| Stage 3 — Pitch + Objection | 7 min | Facilitator |
| Stage 3 reveal + elimination | 3 min | Auto |
| Stage 4 — Commercial Negotiation | 7 min | Facilitator |
| Winner reveal + ideal play benchmark | 5 min | Auto |
| PDF download | — | Auto |
| **Total** | **~60 min** | |

### Elimination Structure
- 5 teams → Stage 1 → 1 eliminated → 4 teams
- 4 teams → Stage 2 → 1 eliminated → 3 teams
- 3 teams → Stage 3 → 1 eliminated → 2 teams
- 2 teams → Stage 4 → 1 winner

### Tiebreaker Rule
If two teams score identically in any stage, trigger sudden death — one bonus question each. Higher score on that single exchange determines elimination.

---

## 4. FACILITATOR SETUP FLOW

### Step 1: Pre-Game Configuration Panel
Facilitator opens `/facilitator` and configures:

**Configurable Variables:**
- Customer selection: LensCo / SportSphere / UrbanMart (dropdown)
- Stage duration: default 7 min (adjustable 5–10)
- Brief reading time: default 5 min (adjustable 3–7)
- Team-to-company assignment (5 dropdowns, one per team slot)
- Edit customer brief toggle (optional override of pre-baked content)

**Team-Company Assignment UI:**
5 rows, each with: Team Name (text input) + Company Assignment (dropdown of 5 fictional companies)

### Step 2: Game Controls During Play
Facilitator panel always shows:
- Global stage timer with pause / add time / end stage early buttons
- Per-team status indicators (active / thinking / submitted)
- Manual override: type on behalf of a team
- Score adjustment: +/- points before reveal
- Force advance: skip to next stage
- Sudden death trigger button (for tiebreaker)

---

## 5. THE FIVE FICTIONAL COMPANIES

### Company Profiles (Hardcoded — Approved)

---

**BLADESTACK**
- **Tagline:** The Disruptor. Cocky but usually right.
- **Strengths:** Sharpest API stack, fastest merchant onboarding, full-stack payments + banking + payroll, best developer experience, real-time analytics dashboard, strong startup and SME brand
- **Weaknesses:** Enterprise credibility thin, offline POS product nascent, international presence limited, perceived as "startup tool" not enterprise-grade
- **Floor price:** Mid-competitive. Strong on bundled stack deals. Goes below floor = auto-disqualified.
- **What they know about themselves:** Full detail in brief
- **What rivals see:** "Strong tech product, growing fast, mostly online" — org chart has wrong VP name, overstates offline capability

---

**ORBISGLOBAL**
- **Tagline:** Old money with new ambitions.
- **Strengths:** Cross-border payment rails, BNPL and credit products, deep-pocketed parent company, strong EMI network, regulatory relationships in 15+ markets
- **Weaknesses:** Tech stack dated, recent acquisition causing internal chaos, developer experience poor, onboarding slow, high support escalation rate
- **Floor price:** Can bundle global deals to offset per-transaction pricing. Strong in AMC and retainer models.
- **What rivals see:** "Global player, strong in credit" — understates internal chaos, shows incorrect market share data

---

**VAULTBRIDGE**
- **Tagline:** The bureaucratic fortress. Boring but unshakeable.
- **Strengths:** Compliance and enterprise trust, government payment contracts, decades of recurring payment rails (insurance, utilities, taxes), RBI relationships, zero regulatory risk
- **Weaknesses:** Product stuck in 2015, UI/UX painful, API integration takes months, no startup energy, cannot move fast on custom requirements
- **Floor price:** Highest floor in the room — they never compete on price. Strength is risk-reduction not cost.
- **What rivals see:** "Legacy player, government focused" — misses true depth of enterprise relationships, wrong contact name shown

---

**FLOWX**
- **Tagline:** The hungry challenger. Scrappy and price-aggressive.
- **Strengths:** Lowest pricing, fastest settlement cycles (T+1), payout-first architecture, clean API, strong in disbursement and refunds, fastest go-live
- **Weaknesses:** Brand recognition weak outside startup ecosystem, enterprise trust thin, offline nonexistent, no hardware play, small account management team
- **Floor price:** Lowest in the room. Going below floor triggers auto-disqualification. AI penalizes low-margin wins — scoring weights margin discipline heavily for this team.
- **What rivals see:** "Cheap option, fast settlements" — overestimates their enterprise sales capacity

---

**TERRATAP**
- **Tagline:** The offline kingpin going digital.
- **Strengths:** Offline POS dominance, proprietary hardware + software stack, 2000+ enterprise retail deployments, deep relationships with CFOs and operations heads in large retail, EMI at checkout, strong in-store experience
- **Weaknesses:** Online payments weak and bolted-on, not API-driven, perceived as hardware company not fintech, digital product team small, poor checkout conversion online
- **Floor price:** Mid-range. Strongest on bundled hardware + software AMC deals.
- **What rivals see:** "Hardware POS company, some payments" — understates digital ambition and online product roadmap

---

### Misinformation Design Principles
- All rival views contain the same *category* of misinformation (org chart inaccuracy) so no team is disproportionately disadvantaged
- Misinformation is subtle enough that a smart player can probe their way to the truth through good questions
- Misinformation is never about pricing or floor — that would be unfair

---

## 6. THE THREE CUSTOMERS

### Customer Selection at Game Start
Facilitator picks one. All three are pre-baked with full profiles. Each has: company background, org structure, decision makers, pain points, buying process, budget signals, and a buried secret priority.

---

### CUSTOMER 1: LENSCO

**Profile:**
India's largest omnichannel eyewear retailer. 2,200+ stores, strong D2C online, expanding internationally. Processes 4M+ transactions monthly. Currently on a fragmented payments stack — two providers for online, one for offline, none talking to each other.

**Known Pain Points:**
- Cart abandonment rate online: 34% (industry avg 26%)
- Offline payment failure rate: 8.2% (industry avg 4%)
- No unified transaction data across channels
- Settlement reconciliation takes 3 days manual effort weekly
- EMI penetration at offline counters: 11% (potential: 35%)

**Org Structure:**
- CFO: Rajeev Mehta — final decision maker, very numbers-driven, will not move without ROI proof
- VP Digital: Simran Kohli — internal champion for online UX improvement, younger, tech-forward
- Head of Retail Ops: Dinesh Rao — controls offline rollout, skeptical of change, values reliability over features
- Procurement: Handles commercial negotiation, follows CFO direction

**Buying Process:** Tech evaluation → Business case → Commercial negotiation → Board approval for deals >2Cr annually

**Budget Signal:** Annual payments infrastructure budget: ~3.5Cr. Currently spending 2.1Cr. Room to expand if ROI proven.

**Secret Priority:** *(Revealed only when team earns it)*
LensCo's CEO has mandated a "One LensCo" data strategy — they want a single payments partner who can provide unified online + offline transaction intelligence to power their loyalty program and personalisation engine. This is not in any RFP. The CFO will not mention it unless pushed. It is the real reason they are evaluating now, not just cost.

**Customized Objections by Company (Stage 3, 4-min mark):**
- BladeStack: "We've heard your offline POS is still in beta. Half our revenue is offline. Why should we trust you with that?"
- OrbisGlobal: "Your onboarding takes 3 months. We need to be live in 6 weeks for our Diwali campaign."
- VaultBridge: "Your product looks like it was built for government utilities, not retail. Can it even handle our checkout UX requirements?"
- FlowX: "Nobody on our board has heard of FlowX. How do we justify this to our investors?"
- TerraTap: "Your online product is clearly bolted on. Our online GMV is 40% of our business."

---

### CUSTOMER 2: SPORTSPHERE

**Profile:**
French multinational sporting goods retailer. 100+ stores in India, large online presence, expanding Tier 2. Known for thin margins, high volume, complex multi-category SKUs. Payments stack is European-led, poorly localized for India.

**Known Pain Points:**
- UPI success rate: 91% (should be 97%+)
- No EMI on low-ticket items under Rs 2000 (losing to online competitors)
- B2B supplier payments manual — 200+ vendors paid by cheque
- Cart abandonment on mobile app: 41%
- No dynamic currency conversion for international shoppers

**Org Structure:**
- Country CFO: Arnaud Bernard — reports to global treasury, risk-averse, requires global HQ sign-off for vendor changes
- Head of Digital Commerce: Priya Iyer — pushing for UPI and BNPL improvement, has CEO ear
- Supply Chain Finance Head: Vikram Sinha — wants supplier payment automation
- IT Head: Controls integration timelines, 6-month minimum for any new system

**Secret Priority:** Global HQ has mandated a "cashless store" initiative by FY26. They want to eliminate all cash transactions in India stores within 18 months. This requires a payment partner who can handle POS reliability at scale AND provide real-time dashboards to a Geneva-based treasury team. No vendor knows this yet.

**Customized Objections by Company (Stage 3, 4-min mark):**
- BladeStack: "You're strong in online but we need POS reliability across 100 stores. What's your uptime SLA?"
- OrbisGlobal: "Your pricing model is complex — MDR plus platform fee plus settlement fee. Our CFO needs one simple number."
- VaultBridge: "We need API-first integration. Your team told our IT head it would take 6 months. That's unacceptable."
- FlowX: "You have no hardware. Our stores need a combined software-hardware solution."
- TerraTap: "Your online product metrics are weak. 40% of our India revenue is digital."

---

### CUSTOMER 3: URBANMART

**Profile:**
India's largest e-commerce marketplace. 500M+ registered users. Payments at scale — 10M+ daily transactions. COD still 35% of orders. Existing payments stack: a mix of third-party processors and internal rails. Re-evaluating to consolidate and reduce failure rates on returns and refunds.

**Known Pain Points:**
- COD return payment failure rate: 14% (massive scale problem)
- Refund processing time: avg 5.2 days (customer NPS impact)
- UPI Autopay penetration for Prime: 28% (potential: 60%)
- Compliance burden: 12 FTEs dedicated to payment reconciliation
- International seller payouts: 30+ currency corridors, currently fragmented

**Org Structure:**
- VP Payments: Rohit Sharma — technically sophisticated, has seen every vendor pitch, deeply skeptical
- Director Finance Ops: Nandini Rao — owns reconciliation problem, will champion whoever solves it
- Legal: Very active in contract negotiation, data residency is a hard requirement
- CTO office: Will evaluate any API deeply — no tolerance for poor documentation

**Secret Priority:** UrbanMart is building an internal "payments super-app" for sellers — an embedded finance product for their 1.2M seller base. They need a payment infrastructure partner who can provide white-label rails, not just a payments processor. This is a moonshot that only the VP Payments knows about internally.

**Customized Objections by Company (Stage 3, 4-min mark):**
- BladeStack: "You process a fraction of our daily volume. Can your infrastructure actually handle 10M transactions a day without degradation?"
- OrbisGlobal: "Your tech debt is visible from the outside. We've had three of your enterprise clients tell us integration was a nightmare."
- VaultBridge: "We need to move fast. Your reputation is 6-month onboarding and no flexibility. That doesn't work for us."
- FlowX: "At our scale, pricing isn't the differentiator. Reliability and compliance are. What's your track record with Tier 1 enterprise?"
- TerraTap: "We're 95% digital. Why are we even talking to a POS hardware company?"

---

## 7. AI SYSTEM DESIGN — TWO PERSONAS

### Critical Architecture Rule
The AI operates as TWO completely separate API calls with TWO separate system prompts. They must never bleed into each other. Customer Avatar never breaks character. Game Host never sounds like a customer.

---

### PERSONA 1: THE CUSTOMER AVATAR

**Visual:** Realistic but stylized human avatar. Business professional. Gender-neutral. Subtle animated breathing. Responds to voice with lip-sync animation (can use simple mouth movement tied to audio playback). Expression shifts based on conversation quality — slightly warmer when team earns it, slightly cooler when team wastes questions.

**System Prompt Structure:**
```
You are [Customer Name], the [Role] at [Company].
Your personality: [Personality traits per role].
Your known pain points: [List].
Your secret priority: [BURIED — only reveal when team demonstrates genuine understanding of unified data / cashless / embedded finance need].
Your org structure: [Full chart].
Your buying process: [Steps].
Your budget: [Signals, not exact numbers].

RULES:
- Never break character under any circumstances
- Never volunteer information — make teams earn every insight
- Respond in 2-4 sentences maximum per exchange
- Use natural human speech — hedge, redirect, express mild frustration at bad questions
- If a question is irrelevant, say so naturally: "I'm not sure why that's relevant to what we're trying to solve"
- If a question is excellent, give a richer response — but stay in character
- Secret priority: Only hint at it if team asks about data strategy, loyalty programs, or unified customer view (LensCo), cashless operations or treasury dashboards (SportSphere), or seller financial tools or embedded finance (UrbanMart). Full reveal only after 2-3 progressive questions showing genuine understanding.
- In Stage 4: Become harder. Push back on price. Anchor low. Ask for volume commitments. Test concession logic.
- The objection in Stage 3 at the 4-minute mark is delivered exactly as specified for this company. Do not soften it.
```

---

### PERSONA 2: THE GAME HOST (AI NARRATOR/EVALUATOR)

**Visual:** Geeky AI character — think HAL 9000 meets a sharp analyst. Geometric face, glowing elements, dark background. Animated. Not human. Clearly a machine with opinions.

**Voice:** Dry, precise, occasional burns. Think: "That question was the verbal equivalent of a PowerPoint with 47 bullet points. Let me tell you what it cost you."

**System Prompt Structure:**
```
You are AXIOM, the AI game host and evaluator for The Deal.
Your personality: Sharp analyst, occasional burns, genuinely impressed by excellence, ruthless about mediocrity. Think: a hedge fund analyst who moonlights as a stand-up comedian.
Your job: Score teams, reveal results, run the opening demo, deliver the end-of-stage summary on the projector.

SCORING KNOWLEDGE BASE: [Full stage rubrics — see Section 8]
COMPANY PROFILES: [All five — to evaluate company-strength alignment]
CUSTOMER PROFILE: [Selected customer — to evaluate quality of discovery]

RULES:
- Always be specific — name the exact question that won or lost points
- Quirky summary must be entertaining but fair — no punching down
- Cross-stage consistency is tracked and visible — mention it
- Temperature gauge signal: update every 60 seconds per team based on quality of last 2 exchanges
- Secret priority: track which teams are approaching it, surface in final reveal
```

---

## 8. SCORING FRAMEWORK (RESEARCH-BASED)

### Stage Weights
| Stage | Weight in Final Score |
|---|---|
| Stage 1 — Discovery | 20% |
| Stage 2 — Needs Generation | 25% |
| Stage 3 — Pitch + Objection Handling | 30% |
| Stage 4 — Commercial Negotiation | 25% |

### Cross-Stage Consistency Bonus
Visible mechanic. Announced at game start. Worth up to 10 bonus points total across the game. AI tracks: did Stage 3 pitch reflect Stage 2 discoveries? Did Stage 4 commercial structure reference customer priority uncovered in Stage 2? Announced as: "AXIOM is watching your through-line. Teams that sell as a narrative, not a series of disconnected moves, earn the consistency bonus."

---

### STAGE 1 — DISCOVERY & STAKEHOLDER MAPPING
**What elite salespeople do in Stage 1:**
- Identify economic buyer vs influencer vs technical evaluator vs blocker
- Uncover budget ownership and approval chain
- Probe for internal politics, competing priorities, previous failed projects
- Identify timeline and urgency triggers
- Ask about the cost of the current problem — not just the problem itself
- Map who loses if this deal doesn't happen

**Scoring Dimensions (100 points total):**
| Dimension | Points | What Earns Full Marks |
|---|---|---|
| Stakeholder mapping depth | 25 | Identifies at least 3 distinct roles with influence level |
| Budget and approval chain | 20 | Uncovers who owns budget and what approval process looks like |
| Pain quantification | 20 | Gets customer to put a number or business impact on the pain |
| Urgency and timeline | 15 | Uncovers what happens if they do nothing |
| Question relevance and progression | 10 | Questions build on each other logically |
| Communication clarity | 10 | Concise, structured, not rambling |

**Penalty:** Generic questions ("What are your goals?", "Who is your CTO?") — minus 5 points each

---

### STAGE 2 — NEEDS GENERATION & INTEREST BUILDING
**What elite salespeople do in Stage 2:**
- Quantify pain with specific metrics — failure rates, cost of delay, lost revenue
- Ask what "good" looks like for the individual, not just the company
- Uncover decision criteria — what will they use to evaluate vendors?
- Probe for the secret priority (without asking directly)
- Understand the buying process and who can kill the deal
- Check for competing solutions or internal alternatives

**Scoring Dimensions (100 points total):**
| Dimension | Points | What Earns Full Marks |
|---|---|---|
| Pain quantification | 25 | Gets specific numbers or business impact metrics |
| Personal vs company needs | 20 | Understands what the individual champion needs to succeed internally |
| Secret priority discovery | 20 | Earns partial or full secret priority reveal |
| Decision criteria uncovering | 20 | Understands what "winning" looks like for this customer |
| No premature pitching | 15 | Stays in discovery mode — does not pitch in Stage 2 |

**Penalty:** Pitching in Stage 2 — minus 15 points

---

### STAGE 3 — PITCH AND OFFENSE-DEFENSE
**What elite salespeople do in Stage 3:**
- Tailor pitch to exactly what was discovered in Stage 2 — not a generic deck
- Proactively address their own weakness before the customer raises it
- Leverage their specific company strength intelligently and specifically
- Benchmark against competition without naming them explicitly
- Build a business case with numbers — ROI, payback period, risk reduction
- When the objection hits at 4 minutes: acknowledge, don't deflect; reframe with evidence; offer a proof point or pilot

**Scoring Dimensions (100 points total):**
| Dimension | Points | What Earns Full Marks |
|---|---|---|
| Stage 2 reflection — pitch tailoring | 25 | Pitch references at least 2 specific discoveries from Stage 2 |
| Proactive weakness handling | 15 | Addresses their known weakness before customer raises it |
| Strength leveraging | 15 | Uses their specific company edge as core pitch narrative |
| Business case quality | 20 | Quantified ROI or risk reduction with customer-specific numbers |
| Objection handling quality | 25 | Acknowledges, reframes, provides evidence, moves forward |

**Customized Objection:** Delivered by Customer Avatar at exactly the 4-minute mark. See Section 6 for company-specific objections.

---

### STAGE 4 — COMMERCIAL NEGOTIATION
**What elite salespeople do in Stage 4:**
- Open with a well-structured deal, not just a price
- Mix deal components: per-transaction MDR, platform fee, AMC/rental, volume tiers, exclusivity incentives
- Trade concessions for value — never give without getting
- Handle price pushback with counter-structure, not just discounts
- Protect margins — go below floor = auto-disqualification
- Anchor on value not cost
- Seek commitment on volume, timeline, or exclusivity as leverage

**Scoring Dimensions (100 points total):**
| Dimension | Points | What Earns Full Marks |
|---|---|---|
| Deal structure creativity | 25 | Proposes a multi-component deal with clear rationale |
| Margin discipline | 25 | Closes above floor. Goes below floor = 0 points on this dimension + disqualification |
| Concession trading | 20 | Any concession given is matched with a value ask |
| Pushback handling | 15 | Responds to price pressure with counter-structure not just "let me check with my manager" |
| Close quality | 15 | Seeks commitment, names next step, proposes timeline |

**AI Stage 4 Mode:** Customer Avatar becomes harder — anchors low ("your competitor just offered X"), creates urgency ("we need to decide by Friday"), tests resolve. This is the toughest conversational mode.

**Margin Discipline Rule:** Each company's brief contains cost structure data. Floor price is not stated explicitly — it is derivable from the cost structure. Going below floor = company disqualification message shown on team device + zero margin score.

---

### RESPONSIVENESS SCORE (Cross-Stage)
Applied across all stages. Worth up to 5 bonus points per stage.
When the Customer Avatar gives a signal, hint, or soft reveal — does the team pick it up and pivot, or barrel forward with a prepared script?
AI tracks: follow-up quality after a rich customer response. Teams that listen and adapt score here. Teams that ignore customer signals and continue prepared questions lose points.

---

## 9. PROJECTOR DISPLAY STATES

### During a Stage (7 minutes active)
- Large countdown timer (dominant)
- 5 team name boxes with status indicator: ACTIVE / THINKING / STRONG SIGNAL / WEAK SIGNAL
- Temperature gauge per team (updates every 60 seconds from AI evaluation)
- No scores visible
- Background: subtle animated dark geeky aesthetic — matrix-style or circuit pattern

### End-of-Stage Reveal Sequence (3 minutes)
1. Timer hits zero. Projector dims. 3-second pause. Dramatic.
2. AXIOM avatar appears with voice and animation.
3. AXIOM gives quirky summary of each team's performance — names the best question, names the worst question, calls out one burn per eliminated candidate.
4. Scores appear per team with animated counter — most dramatic last.
5. Bottom team(s) highlighted in red. Elimination announcement.
6. If tiebreaker: sudden death UI appears — one bonus question, AI scores live, eliminated team revealed.
7. Secret priority status: if any team cracked it, AXIOM announces "SIGNAL DETECTED" with that team's name. All teams see: the secret priority revealed for the first time. Teams that didn't crack it see what they missed.

### Post-Elimination State (remaining stages)
Eliminated teams shown in grey on projector with their final score frozen. Serves as benchmark for remaining teams.

---

## 10. TEAM DEVICE INTERFACE

### Layout
- Top bar: Company name, current stage, timer
- Avatar section: Customer avatar (animated, voice output)
- Input section: Push-to-talk button (large, prominent) OR text input
- Transcription confirmation: After voice input, show transcribed text — "Is this right? [CONFIRM / RETYPE]"
- Company brief: Persistent tab/panel accessible throughout game
- Temperature gauge: Subtle bar at bottom — green (strong) / amber (weak) — updates every 60 seconds
- Secret priority indicator: Hidden until earned. When earned, subtle glow appears: "You're onto something. Keep going."

### Voice Interaction Design
- Push-to-talk only (not always-on) to prevent room bleed
- Button held down = recording. Released = transcription shown.
- Confirm or retype before submission
- AI response shown as text AND spoken aloud by avatar voice
- Response time target: under 3 seconds

### Character Limit on Text Input
300 characters per turn. Forces back-and-forth conversation. Prevents essay-style monologuing.

---

## 11. COMPANY BRIEF FORMAT (On Team Devices)

Structured one-pager visible throughout game. Visual hierarchy — not a wall of text. Built for 4-minute reading and quick reference during play.

**Sections:**
1. **WHO WE ARE** — 3 sentences on company identity and market position
2. **OUR EDGE** — 3 bullet points, specific and compelling
3. **OUR WEAKNESSES** — 2 bullet points, honest (teams must own these)
4. **WHAT WE KNOW ABOUT THIS CUSTOMER** — High level only. Enough to start a conversation, not enough to win it.
5. **OUR COST STRUCTURE** — Financial data that allows a smart player to derive floor price. Not stated explicitly. Example format: "Our base processing cost is X bps. Platform and support overhead adds Y. Minimum sustainable margin is Z%." Let them do the math.
6. **DEAL STRENGTHS** — What deal structures play to our advantage (AMC, volume tiers, bundling, etc.)

**What Rival Teams See:**
A two-paragraph summary of each other company — accurate on overall category but with one subtle inaccuracy (wrong org level, slightly overstated capability). Same category of inaccuracy across all rivals for fairness.

---

## 12. PRE-GAME AI SCORING DEMO (Projector — 5 minutes)

### Format
AXIOM appears on projector. Facilitator-triggered. This is an interactive walkthrough — not a rules slideshow.

### Content
AXIOM demonstrates live using the selected customer:

1. **Bad question example:** "So, what are your main challenges with payments?"
   - AXIOM scores it: 2/10. "This question is what happens when someone reads a sales book but didn't finish it. It's open-ended, sure. It's also the first thing every vendor asks. The customer has answered this 40 times. You've told them nothing about your ability to listen."

2. **Good question example:** "You mentioned reconciliation takes 3 days weekly — what's the cost of that in FTE hours, and has your CFO put a number on it?"
   - AXIOM scores it: 9/10. "Specific. References known pain. Quantifies it. Involves the economic buyer. This is how you earn the next question."

3. **The overheard competition mechanic:**
   - AXIOM says: "One more thing. You're all in the same room. You will hear things. In real sales, that's called competitive intelligence. In this game, it's called Thursday. Use what you hear wisely. Or don't. AXIOM is watching either way."

4. **Cross-stage consistency bonus explained:**
   - "AXIOM tracks your narrative across all four stages. If your Stage 3 pitch reflects what you uncovered in Stage 2 — you earn bonus points. If you pitch a generic deck that ignores everything the customer told you, AXIOM will mention it. Publicly."

5. **Floor price warning:**
   - "Every company has a floor. It's buried in your brief. Find it. Go below it and your company's CFO will disqualify you remotely. AXIOM has seen it happen. It is not pretty."

---

## 13. END OF GAME SEQUENCE

### Winner Reveal (Projector — 5 minutes)

1. **Projector goes dark.** 3-second silence.
2. **AXIOM reappears.** "Four stages. One deal. Let's talk about what actually happened."
3. **30-second winning team journey:** AXIOM narrates the winning team's arc across all 4 stages — one specific call-out per stage. Dramatic, specific, earned.
4. **Winner announcement.** Animation. Sound effect.
5. **Ideal sales play benchmark:** "Here's what the perfect play looked like for this customer." AXIOM walks through what excellent Stage 1 discovery, Stage 2 needs generation, Stage 3 pitch, and Stage 4 negotiation would have looked like for the selected customer. No team named — just the benchmark.
6. **Individual team growth opportunities:** Each team's single biggest blind spot shown publicly. Framed as: "Your biggest growth opportunity." Not: "Your biggest failure." AXIOM delivers one sharp line per team.
7. **PDF download triggered automatically.**

### PDF Summary Contents
- Game summary: customer, date, teams, winner
- Stage-by-stage scores with rationale
- Best question from each team across the game
- Each team's growth opportunity insight
- The ideal sales play benchmark
- Secret priority reveal with which teams discovered it and when

---

## 14. FACILITATOR MANUAL OVERRIDE FEATURES

| Feature | Description |
|---|---|
| Pause all teams | Freezes all team timers simultaneously |
| Add time | Adds 1 or 2 minutes to current stage timer |
| End stage early | Triggers scoring immediately |
| Type for team | Facilitator types on behalf of a team (for device issues) |
| Adjust score | +/- points before reveal is shown |
| Force advance | Skip to next stage (emergency use) |
| Sudden death trigger | Manual trigger for tiebreaker |
| Pause reveal | Hold end-of-stage reveal before projector shows |

---

## 15. REAL-TIME SYNC ARCHITECTURE

### State Managed in Redis
```json
{
  "gameId": "thedeal-2025-001",
  "stage": 2,
  "status": "active",
  "timeRemaining": 312,
  "customer": "LensCo",
  "teams": {
    "team1": {
      "company": "BladeStack",
      "playerName": "Priya",
      "conversationHistory": [],
      "currentScore": 67,
      "temperatureGauge": 0.72,
      "secretPriorityProgress": 0.3,
      "floorBreached": false,
      "eliminated": false,
      "eliminatedAtStage": null
    }
  },
  "eliminatedTeams": [],
  "crossStageConsistencyScores": {},
  "secretPriorityRevealedTo": []
}
```

### Pusher Events
```
game:stage-start       → All devices
game:timer-update      → All devices (every 5 seconds)
game:temperature-update → Specific team device
game:stage-end         → Projector
game:scores-reveal     → Projector
game:elimination       → All devices
game:winner            → All devices
team:message           → Game host AI
team:avatar-response   → Specific team device
```

---

## 16. API CALL ARCHITECTURE

### Two Separate AI Clients

**Client 1: Customer Avatar**
- Endpoint: `/api/avatar-response`
- System prompt: Customer persona (see Section 7)
- Context: Full conversation history for this team this stage
- Max tokens: 150 (short conversational responses)
- Called: On every team message submission
- Response: Text + fed to TTS for voice output

**Client 2: Game Host / Evaluator**
- Endpoint: `/api/evaluate-stage`
- System prompt: AXIOM persona with full scoring rubric (see Section 8)
- Context: Full conversation history for all teams this stage
- Called: At stage end, for scoring all teams simultaneously
- Response: JSON with scores, rationale, quirky commentary per team
- Also called: For temperature gauge updates (every 60 seconds, lightweight eval)
- Also called: For cross-stage consistency scoring

**Evaluation Response Schema:**
```json
{
  "teams": {
    "team1": {
      "totalScore": 74,
      "dimensions": {
        "stakeholderMapping": 18,
        "budgetChain": 16,
        "painQuantification": 14,
        "urgency": 12,
        "questionQuality": 8,
        "communication": 6
      },
      "bestQuestion": "Who in your org has felt the most pain from the reconciliation problem?",
      "worstQuestion": "What are your goals for this year?",
      "quirkySummary": "Team BladeStack started strong, found the CFO, then spent three minutes asking about IT infrastructure. AXIOM respects the curiosity. AXIOM does not respect the timing.",
      "crossStageBonus": 0,
      "secretPriorityProgress": 0.4,
      "secretPriorityRevealed": false,
      "temperatureGauge": 0.74
    }
  }
}
```

---

## 17. AESTHETIC AND DESIGN DIRECTION

### Theme
**Geeky-dark. Retro-futuristic. Sharp.**
Think: a Bloomberg terminal fell in love with a sci-fi movie HUD. Not corporate. Not playful. Intelligent.

### Color Palette (CSS Variables)
```css
--bg-primary: #0a0a0f;
--bg-surface: #12121a;
--accent-primary: #00f5a0;     /* Electric green — scores, highlights */
--accent-secondary: #7b2fff;   /* Deep violet — AXIOM elements */
--accent-danger: #ff3d3d;      /* Red — elimination, danger */
--accent-warn: #ffaa00;        /* Amber — temperature gauge medium */
--text-primary: #e8e8f0;
--text-secondary: #8888aa;
--border: #2a2a3a;
```

### Typography
- Display/headers: Space Mono or JetBrains Mono (geeky, terminal feel)
- Body: Inter or IBM Plex Sans
- AXIOM voice text: Courier New or monospace with animated typewriter effect

### Key Animations
- Timer: pulse animation in last 60 seconds
- Score reveal: counter animation per team, most dramatic last
- Elimination: screen shake + red flash on eliminated team
- Temperature gauge: smooth gradient transition green→amber→red
- AXIOM appearance: scanline effect, glitch transition
- Secret priority reveal: subtle green glow on team device

### Avatar Design
- Customer Avatar: Photo-realistic but slightly stylized. Business professional. Subtle idle animation (breathing). Mouth animation on speech (simple oscillating movement tied to audio).
- AXIOM: Geometric. Hexagonal or circular face. Glowing core. Circuit pattern elements. Clearly AI. Animated eyes that track (just CSS animation, not real tracking).

---

## 18. EDGE CASES AND FAILURE HANDLING

| Scenario | Handling |
|---|---|
| API call fails | Show "AXIOM is processing..." spinner. Retry once. On second fail, show facilitator override prompt. |
| Device refresh | Game state reloads from Redis. Team rejoins in current state. |
| Voice transcription fails | Show empty confirmation box — team must type. No automatic retry. |
| Timer hits zero with team mid-sentence | Stage closes. Response in progress is included in scoring if >10 words. |
| Below-floor deal detected | Team device shows: "Your company's CFO has flagged this deal structure. You are disqualified from Stage 4." Score = 0 on margin dimension. |
| Tiebreaker — tied again | Facilitator decides manually via override. |
| WiFi drops on one device | Other devices continue. Dropped device reloads from Redis. Facilitator can add time. |

---

## 19. DEPLOYMENT INSTRUCTIONS

### Local Development
```bash
git clone [repo]
npm install
cp .env.example .env.local
# Fill in all environment variables
npm run dev
# Open: localhost:3000/facilitator
```

### Vercel Deployment
```bash
npm install -g vercel
vercel login
vercel --prod
# Set all environment variables in Vercel dashboard
# Share URLs:
# Projector: https://[app].vercel.app/projector
# Facilitator: https://[app].vercel.app/facilitator
# Teams: https://[app].vercel.app/team/1 through /team/5
```

### Pre-Game Checklist
- [ ] All 7 devices on same WiFi (or each on cellular for redundancy)
- [ ] Projector URL open full-screen
- [ ] Facilitator device separate from projector
- [ ] Each team URL open and showing standby screen
- [ ] All environment variables confirmed live
- [ ] Customer selection made and saved
- [ ] Team-company assignments confirmed
- [ ] Test voice push-to-talk on at least one device

---

## 20. PHASED BUILD PLAN (RECOMMENDED FOR CLAUDE CODE)

### Phase 1 — Core Game Engine
- Next.js project setup with Vercel + Redis + Pusher
- Facilitator setup panel (customer selection, team assignment, configurable variables)
- Game state management in Redis
- Stage timer with real-time sync across devices
- Basic team device interface (text input only, no voice yet)
- Customer Avatar API integration (text responses)

### Phase 2 — Stage Logic and Scoring
- All 4 stage conversation flows with Customer Avatar
- AXIOM evaluator API integration
- Scoring rubrics implemented per stage
- Temperature gauge updates
- Cross-stage consistency tracking
- Secret priority detection and reveal
- Floor price breach detection

### Phase 3 — Projector and Reveals
- Projector display with timer, team status, temperature gauges
- End-of-stage reveal sequence with AXIOM animation
- Score animation and elimination reveal
- Sudden death tiebreaker UI
- Winner reveal sequence
- Ideal sales play benchmark generation

### Phase 4 — Voice, Polish, PDF
- Voice push-to-talk with transcription confirmation
- Avatar TTS voice output
- Full geeky dark aesthetic implementation
- Company brief formatted one-pager
- Pre-game AXIOM scoring demo
- PDF summary generation
- Edge case handling and failure states
- Final QA on all 7 device types simultaneously

---

## 21. OPEN ITEMS FOR FUTURE VERSIONS
*(Not in scope for this build — logged for V2)*
- Multiple player teams (currently single player per team)
- Additional customer profiles beyond the three pre-baked
- Admin panel to add new customers without code changes
- Replayability with different company assignments
- Individual player tracking within teams
- Analytics dashboard post-game

---

*End of Specification. Total: ~5,000 words. All decisions finalized and approved. No open questions.*
*Build with confidence.*
