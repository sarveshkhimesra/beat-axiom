import { describe, it, expect } from "vitest";
import { buildShareText } from "./shareText";
import { Verdict } from "./types";

const verdict: Verdict = {
  score: 62, title: "Happy Ears",
  dimensions: { discovery: 16, signal: 10, objection: 18, value: 11, listening: 7 },
  bestLine: "x", worstLine: "y",
  roast: "A hostage negotiation run by the hostage.",
  didDetectSignal: true, didHandleObjection: false,
};

describe("buildShareText", () => {
  it("includes the score, the Rahul mention, and the link", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("https://x.test/r/abc");
  });
  it("includes a roast snippet", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t.toLowerCase()).toContain("hostage");
  });
  it("includes the new wording for game play and challenge", () => {
    const t = buildShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("Just played Beat AXIOM");
    expect(t).toContain("Can you beat my score?");
  });
});
