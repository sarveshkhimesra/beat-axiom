import { describe, it, expect } from "vitest";
import { buildBuyerPrompt } from "./avatarPrompt";
import { getScenario } from "./scenarios";

describe("buildBuyerPrompt", () => {
  const s = getScenario("skeptical-vp");

  it("embeds the buyer name, hidden priority guard, and objection", () => {
    const p = buildBuyerPrompt(s, 1);
    expect(p).toContain("Deepa Narayan");
    expect(p).toContain(s.buyer.hiddenPriority);
    expect(p).toContain(s.buyer.signatureObjection);
  });

  it("tells the model to land the objection once mid-duel (turn >= 3)", () => {
    expect(buildBuyerPrompt(s, 4).toLowerCase()).toContain("objection");
  });
});
