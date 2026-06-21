import { describe, it, expect } from "vitest";
import { parseResponse } from "./parseMeta";

describe("parseResponse", () => {
  it("splits conversational text from metadata", () => {
    const raw = `That's a great question. Let me think about it.\n\n---AXIOM_META---\n{"currentStage":"discovery","stageJustUnlocked":null,"impatienceLevel":0.1,"gameOver":false,"gameOverReason":null,"hookLine":"keep digging."}`;
    const { message, meta } = parseResponse(raw);
    expect(message).toBe("That's a great question. Let me think about it.");
    expect(meta.currentStage).toBe("discovery");
    expect(meta.impatienceLevel).toBe(0.1);
    expect(meta.gameOver).toBe(false);
    expect(meta.hookLine).toBe("keep digging.");
  });

  it("handles missing delimiter gracefully (fallback defaults)", () => {
    const raw = "Just a normal response with no metadata.";
    const { message, meta } = parseResponse(raw);
    expect(message).toBe("Just a normal response with no metadata.");
    expect(meta.currentStage).toBe("discovery");
    expect(meta.stageJustUnlocked).toBeNull();
    expect(meta.impatienceLevel).toBe(0.05);
    expect(meta.gameOver).toBe(false);
  });

  it("handles stage unlock", () => {
    const raw = `Interesting. Tell me more about your solution.\n\n---AXIOM_META---\n{"currentStage":"pitch","stageJustUnlocked":"pitch","impatienceLevel":0.15,"gameOver":false,"gameOverReason":null,"hookLine":"stage unlocked — show them what you've got."}`;
    const { meta } = parseResponse(raw);
    expect(meta.currentStage).toBe("pitch");
    expect(meta.stageJustUnlocked).toBe("pitch");
  });

  it("handles game over (walkaway)", () => {
    const raw = `I need to jump. Thanks for your time.\n\n---AXIOM_META---\n{"currentStage":"discovery","stageJustUnlocked":null,"impatienceLevel":1.0,"gameOver":true,"gameOverReason":"walkaway","hookLine":"buyer walked away."}`;
    const { meta } = parseResponse(raw);
    expect(meta.gameOver).toBe(true);
    expect(meta.gameOverReason).toBe("walkaway");
  });
});
