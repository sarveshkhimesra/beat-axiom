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
  it("includes the score, the LinkedIn mention, and the link", () => {
    const t = buildLinkedInShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@Rahul Kothari");
    expect(t).toContain("https://x.test/r/abc");
  });
  it("includes a roast snippet", () => {
    const t = buildLinkedInShareText(verdict, "https://x.test/r/abc");
    expect(t.toLowerCase()).toContain("hostage");
  });
});

describe("buildTwitterShareText", () => {
  it("includes the score, the Twitter handle, and the link", () => {
    const t = buildTwitterShareText(verdict, "https://x.test/r/abc");
    expect(t).toContain("62");
    expect(t).toContain("@rahul_kothari");
    expect(t).toContain("https://x.test/r/abc");
  });
  it("fits within 280 chars (with 23-char t.co URL)", () => {
    const t = buildTwitterShareText(verdict, "https://x.test/r/abc");
    const withTco = t.replace("https://x.test/r/abc", "https://t.co/xxxxxxxxxxxx");
    expect(withTco.length).toBeLessThanOrEqual(280);
  });
});
