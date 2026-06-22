import { describe, it, expect } from "vitest";
import { SCENARIOS, SCENARIO_IDS, getScenario, randomScenario } from "./scenarios";

describe("scenarios", () => {
  it("has exactly 5 scenarios keyed by id", () => {
    expect(SCENARIO_IDS).toHaveLength(5);
    for (const id of SCENARIO_IDS) expect(SCENARIOS[id].id).toBe(id);
  });

  it("every scenario has a hidden priority and a signature objection", () => {
    for (const id of SCENARIO_IDS) {
      const s = SCENARIOS[id];
      expect(s.buyer.hiddenPriority.length).toBeGreaterThan(10);
      expect(s.buyer.signatureObjection.length).toBeGreaterThan(10);
      expect(s.buyer.hiddenPriorityHintTopics.length).toBeGreaterThan(0);
    }
  });

  it("getScenario returns the right one, randomScenario returns a known id", () => {
    expect(getScenario("cutting-cfo").id).toBe("cutting-cfo");
    expect(SCENARIO_IDS).toContain(randomScenario().id);
  });

  it("scenarios are domain-neutral (no payments-specific terms)", () => {
    const blob = JSON.stringify(SCENARIOS).toLowerCase();
    for (const term of ["novabrand", "upi", "bnpl", "checkout", "razorpay", "bps"]) {
      expect(blob).not.toContain(term);
    }
  });
});
