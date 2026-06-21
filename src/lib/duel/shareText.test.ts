import { describe, it, expect } from "vitest";
import { buildShareText } from "./shareText";
import { V2Verdict } from "./types";

const verdict: V2Verdict = {
  score: 62, title: "Happy Ears",
  stageScores: { discovery: {}, pitch: {}, negotiate: {}, close: {} },
  modifiers: { efficiency: 0, hiddenPriority: 0, walkaway: false, genericPenalty: 0, prematurePitch: 0 },
  bestLine: "x", worstLine: "y",
  roast: "A hostage negotiation run by the hostage.",
  stagesSummary: "Discovery (3)",
  didDetectSignal: false, buyerWalkedAway: false,
};

describe("buildShareText", () => {
  it("includes the score, Rahul mention, and link", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("https://x.test/r/abc");
  });
  it("includes a roast snippet", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t.toLowerCase()).toContain("hostage");
  });
});
