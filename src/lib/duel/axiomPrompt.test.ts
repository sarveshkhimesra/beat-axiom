import { describe, it, expect } from "vitest";
import { buildAxiomVerdictPrompt } from "./axiomPrompt";
import { getScenario } from "./scenarios";

describe("buildAxiomVerdictPrompt", () => {
  const s = getScenario("cutting-cfo");
  const p = buildAxiomVerdictPrompt(s);

  it("identifies AXIOM as Rahul Kothari's AI", () => {
    expect(p).toContain("Rahul Kothari");
  });
  it("lists every rubric dimension with its max points", () => {
    for (const dim of ["discovery", "signal", "objection", "value", "listening"]) {
      expect(p).toContain(dim);
    }
    expect(p).toContain("25");
    expect(p).toContain("10");
  });
  it("requires strict JSON output with the expected keys", () => {
    expect(p).toContain("\"score\"");
    expect(p).toContain("\"roast\"");
    expect(p).toContain("didDetectSignal");
  });
  it("includes the roast style guard (never punching down)", () => {
    expect(p.toLowerCase()).toContain("never");
  });
});
