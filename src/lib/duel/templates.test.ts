import { describe, it, expect } from "vitest";
import { TEMPLATES, TEMPLATE_IDS, getTemplate } from "./templates";

describe("templates", () => {
  it("has exactly 8 templates", () => {
    expect(TEMPLATE_IDS).toHaveLength(8);
  });

  it("every template has required fields", () => {
    for (const id of TEMPLATE_IDS) {
      const t = TEMPLATES[id];
      expect(t.id).toBe(id);
      expect(t.hiddenPriority.length).toBeGreaterThan(10);
      expect(t.signatureObjection.length).toBeGreaterThan(10);
      expect(t.hiddenPriorityHintTopics.length).toBeGreaterThanOrEqual(3);
      expect(t.stageUnlockCriteria.discovery).toBeDefined();
      expect(t.stageUnlockCriteria.pitch).toBeDefined();
      expect(t.stageUnlockCriteria.negotiate).toBeDefined();
      expect(t.stageUnlockCriteria.close).toBeDefined();
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(3);
    }
  });

  it("getTemplate throws on unknown id", () => {
    expect(() => getTemplate("nonexistent" as never)).toThrow();
  });

  it("templates are domain-neutral", () => {
    const blob = JSON.stringify(TEMPLATES).toLowerCase();
    for (const term of ["razorpay", "novabrand", "upi", "bnpl"]) {
      expect(blob).not.toContain(term);
    }
  });
});
