import { describe, it, expect } from "vitest";
import { buildLinkedInShareText, buildTwitterShareText } from "./shareText";
import { Verdict } from "./types";

const verdict: Verdict = {
  score: 62, title: "Happy Ears",
  dimensions: { discovery: 16, signal: 10, objection: 18, value: 11, listening: 7 },
  bestLine: "x", worstLine: "y",
  roast: "A hostage negotiation run by the hostage.",
  didDetectSignal: true, didHandleObjection: false,
};

describe("buildLinkedInShareText", () => {
  it("includes score, LinkedIn mention, and game URL", () => {
    const t = buildLinkedInShareText(verdict);
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("https://beat-axiom.vercel.app");
  });
  it("includes a roast snippet", () => {
    const t = buildLinkedInShareText(verdict);
    expect(t.toLowerCase()).toContain("hostage");
  });
});

describe("buildTwitterShareText", () => {
  it("includes score, Twitter handle, and game URL", () => {
    const t = buildTwitterShareText(verdict);
    expect(t).toContain("62");
    expect(t).toContain("@rahul_kothari");
    expect(t).toContain("https://beat-axiom.vercel.app");
  });
  it("fits within 280 chars (with 23-char t.co URL)", () => {
    const t = buildTwitterShareText(verdict);
    const withTco = t.replace("https://beat-axiom.vercel.app", "https://t.co/xxxxxxxxxxxx");
    expect(withTco.length).toBeLessThanOrEqual(280);
  });
});
