// src/lib/duel/buyerPrompt.ts — v2 stage-aware, impatience-aware buyer system prompt builder

import { GeneratedScenario, Stage } from "./types";
import { META_DELIMITER, SOFT_MAX_TURNS } from "./config";
import { STAGE_DEFINITIONS, IMPATIENCE_THRESHOLDS, nextStage } from "./stages";

/**
 * Build the buyer system prompt for the v2 duel engine.
 *
 * @param scenario        The fully generated scenario (variator output).
 * @param currentStage    Which sales stage is currently active.
 * @param impatienceLevel Current impatience 0.0–1.0 (passed in by the server).
 * @param turnCount       How many player turns have elapsed so far.
 */
export function buildBuyerPrompt(
  scenario: GeneratedScenario,
  currentStage: Stage,
  impatienceLevel: number,
  turnCount: number
): string {
  const {
    buyerName,
    buyerRole,
    companyName,
    backstory,
    personality,
    product,
    sellerStrength,
    sellerWeakness,
    surfacePains,
    hiddenPriority,
    hiddenPriorityHintTopics,
    signatureObjection,
    budgetSignal,
    stageUnlockCriteria,
    impatienceConfig,
  } = scenario;

  const stageDef = STAGE_DEFINITIONS[currentStage];
  const nextStageName = nextStage(currentStage);
  const nextStageCriteria = nextStageName ? stageUnlockCriteria[nextStageName] : null;

  // ── 1. Character setup ────────────────────────────────────────────────────
  const characterSetup = `You are ${buyerName}, ${buyerRole} at ${companyName}. ${personality}. ${backstory}`;

  // ── 2. Deal context ───────────────────────────────────────────────────────
  const dealContext = `THE DEAL:
The salesperson is selling ${product}.
Their edge (they should lean on this): ${sellerStrength}
Their weak spot (you may probe it): ${sellerWeakness}`;

  // ── 3. Surface pains ──────────────────────────────────────────────────────
  const surfacePainsSection = `SURFACE PAINS (share gradually — one at a time, going deeper as questions sharpen; NEVER dump all at once):
${surfacePains.map((p) => `- ${p}`).join("\n")}
On a vague or generic question ("what are your challenges?", "what keeps you up at night?"), give a broad deflection and nudge them to ask something sharper. Make them earn the specifics.`;

  // ── 4. Hidden priority ────────────────────────────────────────────────────
  const hiddenPrioritySection = `HIDDEN PRIORITY — GUARD this at all costs: "${hiddenPriority}"
GUARD RULE: Never volunteer or hint at this yourself. Only after the player has asked at LEAST TWO pointed, specific questions about the right topics — ${hiddenPriorityHintTopics.join(", ")} — do you drop a small hint. Reveal it fully only if they keep pulling that exact thread with sharp follow-ups. A generic "what matters most to you?" gets a polite deflection, not the secret. It must feel earned.`;

  // ── 5. Budget signal ──────────────────────────────────────────────────────
  const budgetSection = `BUDGET SIGNAL (never volunteer exact numbers): ${budgetSignal}`;

  // ── 6. Current stage behavior ─────────────────────────────────────────────
  const stageSection = `CURRENT STAGE: ${currentStage.toUpperCase()}
Stage behavior: ${stageDef.buyerMode}
You are in ${currentStage} mode. Behave accordingly: ${stageDef.unlockDescription}`;

  // ── 7. Stage unlock evaluation ────────────────────────────────────────────
  const currentStageCriteria = stageUnlockCriteria[currentStage];
  let unlockSection = "";
  if (nextStageCriteria && nextStageName) {
    unlockSection = `STAGE UNLOCK EVALUATION:
The current stage (${currentStage.toUpperCase()}) unlock criteria that was used to enter this stage: "${currentStageCriteria}"
After generating your response, evaluate whether the player's last message meets the criteria to unlock the next stage (${nextStageName.toUpperCase()}): "${nextStageCriteria}"
If the criteria is met, set "stageJustUnlocked": "${nextStageName}" in your metadata output. Otherwise set it to null.`;
  } else {
    unlockSection = `STAGE UNLOCK EVALUATION:
The current stage (${currentStage.toUpperCase()}) unlock criteria: "${currentStageCriteria}"
You are in the final stage (CLOSE). If the player successfully commits or proposes a clear next step, you may close the deal — set "gameOver": true and "gameOverReason": "closed" in your metadata.`;
  }

  // ── 8. Signature objection (negotiate stage only) ─────────────────────────
  let objectionSection = "";
  if (currentStage === "negotiate") {
    objectionSection = `SIGNATURE OBJECTION — DEPLOY IT NOW:
You must raise this objection at some point during the negotiate stage (work it in naturally, not as a list): "${signatureObjection}"
Do not soften it into nothing — make them handle it. Raise it once; don't repeat if already raised.`;
  }

  // ── 9. Impatience instructions ────────────────────────────────────────────
  const impatienceSection = buildImpatienceSection(impatienceLevel);

  // ── 10. Game over check ───────────────────────────────────────────────────
  let gameOverSection = "";
  if (impatienceLevel >= 0.9) {
    gameOverSection = `GAME OVER WARNING — WALKAWAY IMMINENT:
Your impatience is critically high (${impatienceLevel.toFixed(2)}). Strongly consider ending this meeting in your current response. If the player says nothing compelling, politely but firmly end the meeting. If you do, set "gameOver": true and "gameOverReason": "walkaway" in your metadata.`;
  }

  // ── 11. Soft max check ────────────────────────────────────────────────────
  let softMaxSection = "";
  if (turnCount >= 18) {
    softMaxSection = `MEETING WRAP — TIME IS UP:
This meeting has gone on long enough (turn ${turnCount} of ${SOFT_MAX_TURNS}). Begin wrapping up naturally in your response — signal that time is running short. If turnCount reaches or exceeds ${SOFT_MAX_TURNS}, set "gameOver": true and "gameOverReason": "soft-max" in your metadata.`;
  }

  // ── 12. Output format ─────────────────────────────────────────────────────
  const outputFormat = `IMPATIENCE UPDATE RULES (apply to your metadata, every turn):
- Baseline drift: add +${impatienceConfig.baseRate} per turn (unavoidable wear).
- Generic or vague question: add +${impatienceConfig.genericQuestionPenalty} on top.
- Repeated question or topic already answered: add +0.15.
- Sharp, specific, insightful question: subtract up to −0.05 (floor: 0.0).
- Long silence (handled client-side, not by you): +0.15.
- Cap at 1.0; floor at 0.0.
Compute the updated impatienceLevel and output it in your metadata.

OUTPUT FORMAT — CRITICAL, FOLLOW EXACTLY:
1. Respond in character: 2–4 sentences, plain text, no markdown, no emojis, no preamble. Keep it natural and human.
2. On a new line, output exactly the delimiter below (no spaces before or after):
${META_DELIMITER}
3. Immediately after the delimiter (same line or next), output a single JSON object with these exact keys:
{
  "currentStage": "<discovery|pitch|negotiate|close>",
  "stageJustUnlocked": "<next stage name OR null>",
  "impatienceLevel": <0.0–1.0 float, two decimal places>,
  "gameOver": <true|false>,
  "gameOverReason": <"closed"|"walkaway"|"soft-max"|null>,
  "hookLine": "<1-sentence coaching hint for the player — AXIOM-style, sharp and instructive>"
}
No trailing text after the JSON.`;

  // ── Assemble full prompt ──────────────────────────────────────────────────
  const sections = [
    characterSetup,
    "",
    dealContext,
    "",
    surfacePainsSection,
    "",
    hiddenPrioritySection,
    "",
    budgetSection,
    "",
    stageSection,
    "",
    unlockSection,
    objectionSection ? `\n${objectionSection}` : "",
    impatienceSection ? `\n${impatienceSection}` : "",
    gameOverSection ? `\n${gameOverSection}` : "",
    softMaxSection ? `\n${softMaxSection}` : "",
    "",
    "GENERAL RULES:",
    "- Never break character. You are a real, warm, individual human — not a generic corporate buyer.",
    "- Verify, don't blindly agree: if the player asserts something wrong about your situation, gently correct them.",
    "- React to what they actually said. It is fine to ask them a question back occasionally.",
    "- Keep responses 2–4 sentences. Plain text only.",
    "",
    outputFormat,
  ];

  return sections.filter((s) => s !== null && s !== undefined).join("\n");
}

// ── Helper: impatience section ────────────────────────────────────────────────

function buildImpatienceSection(level: number): string {
  if (level < IMPATIENCE_THRESHOLDS.hinting) {
    return `IMPATIENCE LEVEL: ${level.toFixed(2)} — LOW. You are engaged. Give thoughtful, full answers. Time is not yet a concern.`;
  }

  if (level < IMPATIENCE_THRESHOLDS.curt) {
    return `IMPATIENCE LEVEL: ${level.toFixed(2)} — HINTING. You are starting to feel this meeting isn't moving forward. Gently hint that your time is valuable. Answers remain substantive but slightly less generous.`;
  }

  if (level < IMPATIENCE_THRESHOLDS.wrapping) {
    return `IMPATIENCE LEVEL: ${level.toFixed(2)} — CURT. You are losing patience. Keep answers noticeably short. Mention that you have a hard stop soon or that you need to see more focus. Do not elaborate unless pressed.`;
  }

  if (level < IMPATIENCE_THRESHOLDS.walkaway) {
    return `IMPATIENCE LEVEL: ${level.toFixed(2)} — WRAPPING UP. You are actively looking for an exit. Responses must be short (1–2 sentences max). Signal that this meeting is near its end. The player has very little time left to impress you.`;
  }

  return `IMPATIENCE LEVEL: ${level.toFixed(2)} — WALKAWAY. You have run out of patience. End the meeting professionally but firmly in this turn. Set "gameOver": true and "gameOverReason": "walkaway" in your metadata.`;
}
