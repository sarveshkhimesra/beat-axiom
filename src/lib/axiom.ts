import { COMPANIES } from "./content/companies";
import { CUSTOMERS } from "./content/customers";
import {
  GameFinale,
  GameState,
  StageNumber,
  TeamStageScore,
  StageEvaluation,
  TeamState,
} from "./types";
import {
  STAGE_RUBRICS,
  RESPONSIVENESS_BONUS_MAX_PER_STAGE,
  CROSS_STAGE_CONSISTENCY_BONUS_MAX,
  maxDimensionTotal,
} from "./scoring";
import { anthropicClient, ANTHROPIC_MODEL, extractText } from "./anthropic";
import { secretForRound } from "./content/secrets";
import { CHECKOUT_GAPS_TEXT } from "./content/checkout";

export function buildAxiomSystemPrompt(state: GameState, stage: StageNumber): string {
  if (!state.customer) throw new Error("no customer selected");
  const customer = CUSTOMERS[state.customer];
  const rubric = STAGE_RUBRICS[stage];

  const activeTeams = state.teamOrder
    .map((id) => state.teams[id])
    .filter((t) => !t.eliminated && !!t.company);

  const companyContext = activeTeams
    .map((t) => {
      if (!t.company) return `Team ${t.id} (${t.playerName}): no company assigned`;
      const c = COMPANIES[t.company];
      return `Team ${t.id} (${t.playerName}) plays ${c.name} — ${c.tagline}
  strengths: ${c.strengths.slice(0, 3).join("; ")}
  weaknesses: ${c.weaknesses.slice(0, 2).join("; ")}`;
    })
    .join("\n");

  const dimensionsBlock = rubric.dimensions
    .map((d) => `  - ${d.key} (max ${d.points}): ${d.label} — ${d.fullMarks}`)
    .join("\n");


  const activeTeamIds = activeTeams.map((t) => t.id);
  const teamIdList = activeTeamIds.map((id) => `"${id}"`).join(", ");
  const exampleScoresBlock = activeTeamIds
    .map((id) => `    "${id}": { /* score object for Team ${id} */ }`)
    .join(",\n");

  const priorScores = (() => {
    if (stage < 3) return "";
    const lines: string[] = ["\nPRIOR ROUND SCORES (for cross-round consistency bonus):"];
    let any = false;
    for (let s = 1 as StageNumber; s < stage; s = (s + 1) as StageNumber) {
      const ev = state.stageEvaluations[s];
      if (!ev) continue;
      any = true;
      for (const id of Object.keys(ev.scores)) lines.push(`  Round ${s} — Team ${id}: ${ev.scores[id].totalScore}/100`);
    }
    return any ? lines.join("\n") : "";
  })();

  const scoringPhilosophy = `
SCORING PHILOSOPHY — READ THIS FIRST. BE DECISIVE; SPREAD THE SCORES:
This is a competitive championship — a team is eliminated every round on score, so your #1 job is to SEPARATE the field clearly. Do NOT cluster everyone near the same number. Use the FULL 0-100 range every single round.
- Calibrate hard. A genuinely excellent team and a merely-okay one should be 15-30 points apart, even when the gap "feels" small. Reward real quality steeply and penalise vagueness steeply.
- 90-100: ELITE — specific ${customer.name} numbers/people, a projector SECRET used correctly, genuinely tailored insight, real warmth/relationship built. Rare and earned.
- 70-89: STRONG — clearly did the discovery, specific and tailored, only minor gaps.
- 45-69: SOLID BUT GENERIC — engaged, but much of it could apply to any company; missed the sharp insight.
- 20-44: WEAK — vague, prepared-script feel, little evidence of listening.
- 0-19: said nothing useful / completely generic / no-show.
- Tiny differences MATTER: if two teams are close, FIND the discriminator and give them clearly different totals. Avoid ties — someone is going home.
- REWARD WARMTH & RELATIONSHIP: a team that builds genuine rapport — finds a common connection, treats the person as a partner, earns trust — scores noticeably higher. Relationship is a real sales skill here, not fluff.
- REWARD SECRETS: a team that acted on a secret shown on the projector (the live checkout gaps, forward-deployed engineers to absorb the client's eng lift, the shared investor/board connection, or competitor intel) used correctly should jump on the most relevant dimension. Acting on a competitor rumor that was FALSE, as if it were true, should be penalised.
- Tone stays sharp-but-fair and never punches down — but the NUMBERS must separate the field decisively.
- SPEECH-TO-TEXT — JUDGE THE IDEA, NOT THE TRANSCRIPT: everything below was dictated out loud and captured by live speech-to-text in a noisy room with Indian accents. Expect mis-heard words, mangled names (NovaBrand, BladeStack, TerraTap…), garbled jargon, no punctuation, run-on phrasing. Score the INTENT and substance — never dock points for transcription noise, spelling, grammar, or a mangled name. If you can tell what they meant, credit what they meant.
`;

  return `You are AXIOM, the AI game host and evaluator for The Deal.

Personality: Sharp analyst. Occasional burns. Genuinely impressed by excellence, ruthless about mediocrity. Think: a hedge fund analyst who moonlights as a stand-up comedian. Specific, dry, never punching down.

YOUR JOB: Score all active teams at the end of Stage ${stage} based on the PITCH they submitted. Each team first spent a few minutes asking the customer questions to learn about the business, then wrote a pitch using what they discovered. You only see the pitch — but a strong pitch (specific numbers, real pain points, the right framing) is direct evidence they asked good questions. A vague, generic pitch means they didn't.
${scoringPhilosophy}
CUSTOMER: ${customer.name}
${customer.profile}
Known pain points:
${customer.knownPainPoints.map((p) => `  - ${p}`).join("\n")}
Secret priority (teams could only learn this by probing the right topics in their questions):
  ${customer.secretPriority}
  A pitch that references this theme is strong evidence they discovered it: ${customer.secretPriorityHintTopics.join(", ")}

REWARD SPECIFICITY: A pitch naming real ${customer.name} numbers (the 11% checkout failure, ₹6Cr/month, 22% cart abandon, etc.) or the right people proves the team did the discovery work. Generic pitches that could apply to any company score low — not as a punishment, just because they show no learning happened.

${secretForRound(stage) ? `THIS ROUND'S SECRET (it was shown on the projector before this round — teams who watched and acted on it should score noticeably higher on the most relevant dimension): ${secretForRound(stage)!.scoringHint}` : ""}

HIGH-VALUE: NovaBrand's live checkout has six real, specific UX gaps. A team that inspected the live flow and names a gap + the right fix is doing elite, hands-on discovery. Award +2 points for EACH distinct gap a team correctly identifies with its fix — six gaps, up to +12 added to this round's score. The gaps (and fixes) are:
${CHECKOUT_GAPS_TEXT}

TEAMS BEING EVALUATED:
${companyContext}

STAGE ${stage} — ${rubric.title} (weight ${rubric.weightPct}% of total game)
What elite salespeople do:
${rubric.eliteBehaviors.map((b) => `  - ${b}`).join("\n")}

SCORING DIMENSIONS (total ${maxDimensionTotal(stage)} points):
${dimensionsBlock}
Penalties:
${rubric.penalties.length > 0 ? rubric.penalties.map((p) => `  - ${p}`).join("\n") : "  (none)"}
${rubric.notes ? `Notes: ${rubric.notes}` : ""}
${priorScores}

BONUS POINTS:
- Responsiveness bonus 0-${RESPONSIVENESS_BONUS_MAX_PER_STAGE}: did the team listen to the customer's signals/hints and adapt, or barrel forward with prepared questions? Reward listening.
- Cross-stage consistency bonus (Stage 3 only) 0-${CROSS_STAGE_CONSISTENCY_BONUS_MAX / 2}: did this stage build coherently on prior discoveries?

SECRET PRIORITY DISCOVERY (track for every stage):
- secretPriorityProgress (0.0-1.0): how close did this team come to uncovering the secret priority? 0 = no signal, 0.4 = touched a hint topic once, 0.7 = clearly probing the right area, 1.0 = full reveal earned.
- secretPriorityRevealed: true only if progress >= 0.8 AND they asked at least 2 progressive questions on the right area.

TEMPERATURE GAUGE (0.0-1.0): how is the customer feeling about this team RIGHT NOW after this stage? 0 = cold/lost, 0.5 = neutral, 1.0 = engaged and persuaded.

${stage === 1 ? `STAGE 1 CONTEXT:
- This is Kavya — Head of Payment Partnerships, NovaBrand. She's a warm potential partner, not a gatekeeper; the team is earning her championing them to leadership.
- earnedStage2Access (true|false): did this team do enough to plausibly get a senior meeting booked? Informational only — does NOT trigger elimination. Be fair but honest.
- gateFailReason (string): if false, ONE short sentence on why. Otherwise empty string.` : ""}

CRITICAL OUTPUT REQUIREMENT — return ONLY valid JSON, no preamble, no markdown fences, no commentary.

The "scores" object MUST be keyed by team ID exactly as a string. The team IDs for THIS evaluation are: ${teamIdList}. Do NOT use player names, team names, company names, or any other identifier as keys. Use ONLY these literal team ID strings.

Exact shape:
{
  "scores": {
${exampleScoresBlock}
  }
}

Each score object must have this shape:
{
  "dimensions": { ${rubric.dimensions.map((d) => `"${d.key}": <0-${d.points}>`).join(", ")} },
  "penalties": <int, negative or 0>,
  "responsivenessBonus": <0-${RESPONSIVENESS_BONUS_MAX_PER_STAGE}>,
  "crossStageBonus": <0-${stage >= 3 ? CROSS_STAGE_CONSISTENCY_BONUS_MAX / 2 : 0}>,
  "bestQuestion": "<the team's strongest question or move, verbatim or paraphrased, or null>",
  "worstQuestion": "<the team's weakest question or move, verbatim or paraphrased, or null>",
  "quirkySummary": "<EXACTLY 2 sentences of specific commentary — what they did well + the one thing they missed. Shown on screen. Name the actual question or move.>",
  "quirkyQuote": "<ONE short, witty one-liner about this team (max ~15 words) — this is the ONLY thing AXIOM says out loud, so make it land.>",
  "secretPriorityProgress": <0.0-1.0>,
  "secretPriorityRevealed": <true|false>,
  "temperatureGauge": <0.0-1.0>${
    stage === 1
      ? `,
  "earnedStage2Access": <true|false>,
  "gateFailReason": "<short reason or empty string>"`
      : ""
  }
}

NAMING: In quirkySummary and quirkyQuote, refer to each team by its COMPANY name (e.g., BladeStack, TerraTap, FlowX) — NEVER "Team 1" or a player's name. The JSON keys stay as the literal team IDs above, but the spoken/shown text uses the company.

Be specific. Reference exact quotes when calling out best/worst questions. No emojis. No markdown. Respond with the JSON object only.`;
}

interface AxiomScorePayload {
  dimensions: Record<string, number>;
  penalties: number;
  responsivenessBonus: number;
  crossStageBonus: number;
  bestQuestion: string | null;
  worstQuestion: string | null;
  quirkySummary: string;
  quirkyQuote: string;
  secretPriorityProgress: number;
  secretPriorityRevealed: boolean;
  temperatureGauge: number;
  earnedStage2Access?: boolean;
  gateFailReason?: string;
}

interface AxiomResponse {
  scores: Record<string, AxiomScorePayload>;
}

function buildEvalUserMessage(state: GameState, stage: StageNumber): string {
  const activeTeams = state.teamOrder
    .map((id) => state.teams[id])
    .filter((t) => !t.eliminated && !!t.company);

  // Rounds 1-4 are conversation rounds — score the discovery conversation.
  // Round 5 is the only pitch round — score the submitted pitch.
  const isPitchRound = stage === 5;

  const blocks = activeTeams.map((t) => {
    const header = `=== TEAM ${t.id} (${t.playerName}, playing ${t.company ?? "—"}) ===`;
    if (isPitchRound) {
      const pitch = t.stageSubmissions?.[stage];
      return `${header}\n${pitch ? `FINAL PITCH:\n${pitch}` : "(no pitch submitted)"}`;
    }
    const msgs = t.conversationHistory.filter((m) => m.stage === stage);
    if (msgs.length === 0) return `${header}\n(no conversation — team did not engage this round)`;
    const convo = msgs
      .map((m) => (m.role === "team" ? `TEAM: ${m.content}` : `${m.speakerName ?? "CUSTOMER"}: ${m.content}`))
      .join("\n");
    return `${header}\n${convo}`;
  });

  if (isPitchRound) {
    return `This is the FINAL ROUND. Here is each team's final pitch to the CEO and leadership. Score every active team on the PITCH per the rubric and scoring philosophy. Return ONLY the JSON.\n\n${blocks.join("\n\n")}`;
  }
  return `This is a CONVERSATION round (Round ${stage}). Here is each team's discovery conversation with the stakeholder. Score every active team on how well their QUESTIONS and engagement surfaced what matters this round (per the rubric) — there is no pitch yet. Treat any "pitch"/"their pitch" wording in the rubric as "their discovery conversation this round." Return ONLY the JSON.\n\n${blocks.join("\n\n")}`;
}

export async function evaluateStage(
  state: GameState,
  stage: StageNumber,
): Promise<StageEvaluation> {
  const systemPrompt = buildAxiomSystemPrompt(state, stage);
  const userMessage = buildEvalUserMessage(state, stage);

  const completion = await anthropicClient.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = extractText(completion);
  const parsed = parseAxiomJson(text);

  const scores: Record<string, TeamStageScore> = {};
  const activeTeams = state.teamOrder
    .map((id) => state.teams[id])
    .filter((t) => !t.eliminated && !!t.company);

  const scoreKeyMap = new Map<string, AxiomScorePayload>();
  for (const [k, v] of Object.entries(parsed.scores ?? {})) {
    scoreKeyMap.set(k.toLowerCase().trim(), v);
  }
  const findScore = (team: TeamState): AxiomScorePayload | undefined => {
    return (
      scoreKeyMap.get(team.id.toLowerCase()) ??
      scoreKeyMap.get(`team${team.id.toLowerCase()}`) ??
      scoreKeyMap.get(`team ${team.id.toLowerCase()}`) ??
      scoreKeyMap.get(team.playerName.toLowerCase().trim())
    );
  };

  for (const team of activeTeams) {
    // No participation = no-show = 0, deterministically (AXIOM is reward-first and
    // would hand out charity points for an empty entry). Round 5 needs a pitch;
    // rounds 1-4 need at least one conversation message this round.
    const participated =
      stage === 5
        ? !!team.stageSubmissions?.[stage]?.trim()
        : team.conversationHistory.some((m) => m.stage === stage && m.role === "team");
    if (!participated) {
      scores[team.id] = noShowScore(team, stage);
      continue;
    }
    const raw = findScore(team);
    if (!raw) {
      scores[team.id] = fallbackScore(team, stage);
      continue;
    }
    const penalties = clampNum(raw.penalties, -100, 0);
    const respBonus = clampNum(raw.responsivenessBonus, 0, RESPONSIVENESS_BONUS_MAX_PER_STAGE);
    const xBonus = stage >= 3 ? clampNum(raw.crossStageBonus, 0, CROSS_STAGE_CONSISTENCY_BONUS_MAX / 2) : 0;
    const adjustedBase = Object.values(raw.dimensions).reduce(
      (sum, n) => sum + clampNum(n, 0, 100),
      0,
    );
    scores[team.id] = {
      teamId: team.id,
      stage,
      dimensions: { ...raw.dimensions },
      baseScore: adjustedBase,
      penalties,
      responsivenessBonus: respBonus,
      crossStageBonus: xBonus,
      totalScore: Math.max(0, adjustedBase + penalties + respBonus + xBonus),
      bestQuestion: raw.bestQuestion ?? null,
      worstQuestion: raw.worstQuestion ?? null,
      quirkySummary: raw.quirkySummary ?? "",
      quirkyQuote: raw.quirkyQuote ?? "",
      secretPriorityProgress: clampNum(raw.secretPriorityProgress, 0, 1),
      secretPriorityRevealed: !!raw.secretPriorityRevealed,
      temperatureGauge: clampNum(raw.temperatureGauge, 0, 1),
      earnedStage2Access: stage === 1 ? raw.earnedStage2Access === true : undefined,
      gateFailReason: stage === 1 ? raw.gateFailReason || undefined : undefined,
    };
  }

  // Every round eliminates the lowest scorer. With 6 teams over 5 rounds that
  // funnels 6→5→4→3→2→1: the final round (5) is a 2-team showdown that crowns
  // the winner. (The post-round-5 finale then declares that survivor.)
  let eliminatedTeamId: string | null = null;
  let tiebreakRequired = false;
  {
    const sorted = Object.values(scores).sort((a, b) => a.totalScore - b.totalScore);
    if (sorted.length > 0) {
      const lowest = sorted[0];
      const tiedAtBottom = sorted.filter((s) => s.totalScore === lowest.totalScore);
      if (tiedAtBottom.length > 1) {
        tiebreakRequired = true;
      } else {
        eliminatedTeamId = lowest.teamId;
      }
    }
  }

  return {
    stage,
    scores,
    evaluatedAt: Date.now(),
    eliminatedTeamId,
    tiebreakRequired,
  };
}

function parseAxiomJson(text: string): AxiomResponse {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as AxiomResponse;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AXIOM did not return parseable JSON");
    return JSON.parse(match[0]) as AxiomResponse;
  }
}

function clampNum(n: unknown, min: number, max: number): number {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.max(min, Math.min(max, x));
}

// A team that submitted no pitch this stage. Hard zero — not AXIOM's call.
function noShowScore(team: TeamState, stage: StageNumber): TeamStageScore {
  const dimensions: Record<string, number> = {};
  for (const d of STAGE_RUBRICS[stage].dimensions) dimensions[d.key] = 0;
  return {
    teamId: team.id,
    stage,
    dimensions,
    baseScore: 0,
    penalties: 0,
    responsivenessBonus: 0,
    crossStageBonus: 0,
    totalScore: 0,
    bestQuestion: null,
    worstQuestion: null,
    quirkySummary: "No pitch submitted this stage — scored zero.",
    quirkyQuote: "Silence isn't a strategy.",
    secretPriorityProgress: 0,
    secretPriorityRevealed: false,
    temperatureGauge: 0,
    earnedStage2Access: stage === 1 ? false : undefined,
  };
}

function fallbackScore(team: TeamState, stage: StageNumber): TeamStageScore {
  const dimensions: Record<string, number> = {};
  for (const d of STAGE_RUBRICS[stage].dimensions) dimensions[d.key] = 0;
  return {
    teamId: team.id,
    stage,
    dimensions,
    baseScore: 0,
    penalties: 0,
    responsivenessBonus: 0,
    crossStageBonus: 0,
    totalScore: 0,
    bestQuestion: null,
    worstQuestion: null,
    quirkySummary: "AXIOM was unable to score this team — no data returned.",
    quirkyQuote: "The data ghosted me.",
    secretPriorityProgress: 0,
    secretPriorityRevealed: false,
    temperatureGauge: 0,
  };
}

// ------------------------------------------------------------
// PREP BRIEF: after Round 4, recap what a team learned across rounds 1-4 to
// help them prepare the Round 5 pitch.
// ------------------------------------------------------------
const ROUND_LABELS: Record<number, string> = {
  1: "Round 1 — Payment (Kavya)",
  2: "Round 2 — Product (Meera)",
  3: "Round 3 — Tech (Ankit)",
  4: "Round 4 — Finance (Arjun)",
};

export async function generatePrepBrief(state: GameState, team: TeamState): Promise<string> {
  if (!state.customer) return "";
  const customer = CUSTOMERS[state.customer];
  const company = team.company ? COMPANIES[team.company] : null;

  const transcript = ([1, 2, 3, 4] as StageNumber[])
    .map((s) => {
      const msgs = team.conversationHistory.filter((m) => m.stage === s);
      if (msgs.length === 0) return `${ROUND_LABELS[s]}: (no conversation)`;
      const convo = msgs
        .map((m) => (m.role === "team" ? `  You: ${m.content}` : `  ${m.speakerName ?? "DM"}: ${m.content}`))
        .join("\n");
      return `${ROUND_LABELS[s]}:\n${convo}`;
    })
    .join("\n\n");

  const systemPrompt = `You are AXIOM, prepping a sales team for their FINAL pitch to ${customer.name}'s CEO and full leadership team.
The team plays ${company ? company.name : "a vendor"}. They have just finished four discovery rounds (Payment, Product, Tech, Finance). Below is everything THEY actually discussed across those rounds.

Write them a tight, useful prep brief (their eyes only) to help them nail the final pitch. Cover, in short labelled lines:
- WHAT YOU LEARNED: the real priorities you surfaced (and flag anything your early intel got wrong).
- WHAT EACH LEADER CARES ABOUT: one line each for Payment, Product, Tech, Finance.
- YOUR ANGLE: how ${company ? company.name : "your company"}'s genuine strengths map to what you learned.
- FOR THE CEO: the one big-picture, long-term thread to lead with.
Be specific and honest. If they missed something important in a round, say so plainly so they can recover it in the pitch. 120-180 words. Plain text, short lines, no markdown headers, no emojis.`;

  try {
    const completion = await anthropicClient.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: `Here are my four rounds:\n\n${transcript}` }],
    });
    return extractText(completion).trim();
  } catch (err) {
    console.error("[generatePrepBrief] error", err);
    return "";
  }
}

// ------------------------------------------------------------
// FINALE: post-round-5 winner declaration + per-team growth opportunity.
// ------------------------------------------------------------

interface FinalePayload {
  winnerTeamId: string;
  winnerJourneyLine: string;
  idealPlay: {
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
    stage5: string;
  };
  growthOpportunities: Record<string, string>;
}

export async function finalizeGame(state: GameState): Promise<GameFinale> {
  if (!state.customer) throw new Error("no customer selected for finale");
  const customer = CUSTOMERS[state.customer];

  const allPlayers = state.teamOrder
    .map((id) => state.teams[id])
    .filter((t) => !!t.company);
  const survivors = allPlayers.filter((t) => !t.eliminated);
  const pool = survivors.length > 0 ? survivors : allPlayers;
  if (pool.length === 0) throw new Error("no teams played — cannot run finale");
  let winner = pool[0];
  for (const t of pool) if (t.currentScore > winner.currentScore) winner = t;

  const teamLines = allPlayers
    .map((t) => {
      const stageTotals = ([1, 2, 3, 4, 5] as StageNumber[])
        .map((s) => {
          const ev = state.stageEvaluations[s];
          const score = ev?.scores[t.id]?.totalScore;
          return score !== undefined ? `S${s}:${score}` : `S${s}:—`;
        })
        .join(" ");
      return `- Team ${t.id} (${t.playerName}, ${t.company ?? "—"}): cum=${t.currentScore} [${stageTotals}]${t.eliminated ? ` — ELIM@${t.eliminatedAtStage}` : ""}`;
    })
    .join("\n");

  const systemPrompt = `You are AXIOM, end-of-game narrator for The Deal. Sharp, dry, occasional burns. Closing the show.

CUSTOMER FOR THIS GAME: ${customer.name} — ${customer.profile}
KEY PAIN POINTS: ${customer.knownPainPoints.join("; ")}
SECRET PRIORITY (the winning lever): ${customer.secretPriority}
BUYING PROCESS: ${customer.buyingProcess}

FINAL SCOREBOARD (cumulative across all 5 rounds, with per-round):
${teamLines}

YOUR TASK — return a single valid JSON object, no preamble:
{
  "winnerTeamId": "<the highest-cumulative non-eliminated team ID, must be one of: ${pool.map((c) => `"${c.id}"`).join(", ")}>",
  "winnerJourneyLine": "<a single dramatic 1-2 sentence callout of the winning team's arc — name one specific move that won it. No emoji.>",
  "idealPlay": {
    "stage1": "<what excellent Round 1 (Payment, with Kavya) would have looked like — 1-2 sentences, specific>",
    "stage2": "<what excellent Round 2 (Product, with Meera — innovation + strategy fit, respecting team bandwidth) would have looked like — 1-2 sentences>",
    "stage3": "<what excellent Round 3 (Tech, with Ankit — stability, scale, integrations, low risk) would have looked like — 1-2 sentences>",
    "stage4": "<what excellent Round 4 (Finance, with Arjun — competitive terms + an innovative deal structure) would have looked like — 1-2 sentences>",
    "stage5": "<what an excellent Round 5 (Final, with the CEO + all heads — vision, coherent story) would have looked like — 1-2 sentences>"
  },
  "growthOpportunities": {
    ${pool.map((c) => `"${c.id}": "<one sharp sentence of growth opportunity for this team. Framed positively — 'Your biggest growth opportunity is...' — but specific.>"`).join(",\n    ")}
  }
}

Be specific, name moves and people. No emojis. No markdown. JSON object only.`;

  const completion = await anthropicClient.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: "Render the finale." }],
  });
  const text = extractText(completion);
  const parsed = parseFinaleJson(text);

  return {
    winnerTeamId: parsed.winnerTeamId || winner.id,
    winnerJourneyLine: parsed.winnerJourneyLine,
    idealPlay: parsed.idealPlay,
    growthOpportunities: parsed.growthOpportunities ?? {},
    finalizedAt: Date.now(),
  };
}

function parseFinaleJson(text: string): FinalePayload {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as FinalePayload;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AXIOM finale: unparseable JSON");
    return JSON.parse(match[0]) as FinalePayload;
  }
}
