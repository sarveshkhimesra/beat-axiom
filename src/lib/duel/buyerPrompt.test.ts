import { describe, it, expect } from "vitest";
import { buildBuyerPrompt } from "./buyerPrompt";
import { GeneratedScenario } from "./types";

const mockScenario: GeneratedScenario = {
  templateId: "skeptical-vp",
  title: "The Skeptical VP",
  companyName: "AcmeCorp",
  backstory: "A mid-size SaaS company.",
  buyerName: "Dana Whitfield",
  buyerRole: "VP of Operations",
  personality: "Measured, guarded, allergic to hype.",
  product: "a team-productivity platform",
  sellerStrength: "fast time-to-value",
  sellerWeakness: "thin enterprise track record",
  surfacePains: ["Tool sprawl", "Failed rollout last year", "Manual reporting"],
  hiddenPriority: "Needs a visible internal win for credibility.",
  hiddenPriorityHintTopics: ["last rollout", "internal standing", "adoption"],
  signatureObjection: "We tried this before. It died in a month.",
  budgetSignal: "Budget exists but scarred.",
  stageUnlockCriteria: { discovery: "≥2 pains + impact", pitch: "value tied to pains", negotiate: "objection handled + structure", close: "commitment asked" },
  impatienceConfig: { baseRate: 0.06, genericQuestionPenalty: 0.08 },
  brief: "You are selling to Dana...",
};

describe("buildBuyerPrompt", () => {
  it("includes the META_DELIMITER instruction", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.1, 3);
    expect(p).toContain("---AXIOM_META---");
  });

  it("includes stage-specific behavior for discovery", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p.toLowerCase()).toContain("warm");
    expect(p).toContain("discovery");
  });

  it("includes impatience instructions when level is high", () => {
    const p = buildBuyerPrompt(mockScenario, "pitch", 0.6, 5);
    expect(p.toLowerCase()).toContain("short");
  });

  it("includes the hidden priority guard", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p).toContain(mockScenario.hiddenPriority);
    expect(p).toContain("GUARD");
  });

  it("includes stage unlock criteria", () => {
    const p = buildBuyerPrompt(mockScenario, "discovery", 0.0, 1);
    expect(p).toContain(mockScenario.stageUnlockCriteria.discovery);
  });

  it("includes the signature objection in negotiate stage", () => {
    const p = buildBuyerPrompt(mockScenario, "negotiate", 0.3, 8);
    expect(p).toContain(mockScenario.signatureObjection);
  });
});
