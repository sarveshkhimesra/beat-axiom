import { describe, it, expect } from "vitest";
import { buildVerdictPrompt } from "./verdictPrompt";
import { GeneratedScenario } from "./types";

const mockScenario = {
  title: "Test",
  buyerName: "Dana",
  buyerRole: "VP Ops",
  hiddenPriority: "needs a visible win",
  signatureObjection: "we tried this before",
} as GeneratedScenario;

describe("buildVerdictPrompt", () => {
  it("includes Rahul Kothari attribution", () => {
    expect(buildVerdictPrompt(mockScenario, ["discovery", "pitch"])).toContain("Rahul Kothari");
  });
  it("includes per-stage rubric dimensions", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery", "pitch", "negotiate", "close"]);
    expect(p).toContain("painDepth");
    expect(p).toContain("tailoring");
    expect(p).toContain("objection");
    expect(p).toContain("nextSteps");
  });
  it("only scores stages that were reached", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery"]);
    expect(p).toContain("painDepth");
    expect(p).not.toContain("tailoring");
  });
  it("includes roast style guide", () => {
    const p = buildVerdictPrompt(mockScenario, ["discovery", "pitch"]);
    expect(p.toLowerCase()).toContain("never punch down");
  });
});
