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
  it("includes score, LinkedIn mention, and CTA", () => {
    const t = buildLinkedInShareText(verdict);
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("Think you can beat me?");
  });
  it("includes a roast snippet", () => {
    const t = buildLinkedInShareText(verdict);
    expect(t.toLowerCase()).toContain("hostage");
  });
  it("does NOT include a URL (LinkedIn adds it via share intent)", () => {
    const t = buildLinkedInShareText(verdict);
    expect(t).not.toContain("http");
  });
});

describe("buildTwitterShareText", () => {
  it("includes score, Twitter handle, and scorecard URL", () => {
    const t = buildTwitterShareText(verdict, "https://beat-axiom.vercel.app/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@rahul_kothari");
    expect(t).toContain("https://beat-axiom.vercel.app/r/abc");
  });
  it("fits within 280 chars (with 23-char t.co URL)", () => {
    const t = buildTwitterShareText(verdict, "https://beat-axiom.vercel.app/r/abc");
    const withTco = t.replace("https://beat-axiom.vercel.app/r/abc", "https://t.co/xxxxxxxxxxxx");
    expect(withTco.length).toBeLessThanOrEqual(280);
  });
});
