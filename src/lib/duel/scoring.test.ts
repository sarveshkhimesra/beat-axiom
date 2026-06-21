import { describe, it, expect } from "vitest";
import { STAGE_RUBRIC, TOTAL_RAW, normalizeScore, titleForScore, parseV2Verdict } from "./scoring";

describe("scoring", () => {
  it("raw points total 180", () => {
    let total = 0;
    for (const stage of Object.values(STAGE_RUBRIC)) {
      total += stage.reduce((a, d) => a + d.maxPoints, 0);
    }
    expect(total).toBe(180);
    expect(TOTAL_RAW).toBe(180);
  });

  it("normalizeScore maps 180 → 100 and 0 → 0", () => {
    expect(normalizeScore(180)).toBe(100);
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(90)).toBe(50);
  });

  it("titleForScore maps bands", () => {
    expect(titleForScore(95)).toBe("Closer");
    expect(titleForScore(30)).toBe("The Brochure");
    expect(titleForScore(10)).toBe("Meeting Cancelled");
  });
});

describe("parseV2Verdict", () => {
  const validJson = JSON.stringify({
    score: 74,
    title: "Contender",
    stageScores: {
      discovery: { painDepth: 12, stakeholders: 8, impact: 7, hiddenPriority: 10 },
      pitch: { tailoring: 11, weakness: 7, value: 6, differentiation: 8 },
      negotiate: { objection: 12, concessions: 6, structure: 7, margin: 8 },
      close: { ask: 7, urgency: 5, hesitation: 6, nextSteps: 8 },
    },
    modifiers: { efficiency: 0, hiddenPriority: 10, walkaway: false, genericPenalty: -6, prematurePitch: 0 },
    bestLine: "Great line here",
    worstLine: "Bad line here",
    roast: "A solid roast.",
    stagesSummary: "Discovery (4) → Pitch (5) → Negotiate (6) → Close (3)",
    didDetectSignal: true,
    buyerWalkedAway: false,
  });

  it("parses valid JSON", () => {
    const v = parseV2Verdict(validJson);
    expect(v.score).toBe(74);
    expect(v.stageScores.discovery.painDepth).toBe(12);
    expect(v.modifiers.hiddenPriority).toBe(10);
  });

  it("extracts JSON from prose wrapping", () => {
    const v = parseV2Verdict("Here:\n```json\n" + validJson + "\n```");
    expect(v.title).toBe("Contender");
  });

  it("clamps score to 0-100", () => {
    const bad = JSON.stringify({ ...JSON.parse(validJson), score: 999 });
    const v = parseV2Verdict(bad);
    expect(v.score).toBeLessThanOrEqual(100);
  });
});
