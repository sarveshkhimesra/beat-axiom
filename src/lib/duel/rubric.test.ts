import { describe, it, expect } from "vitest";
import { RUBRIC, RUBRIC_MAX, titleForScore, parseVerdict } from "./rubric";

describe("rubric", () => {
  it("dimensions sum to 100", () => {
    expect(RUBRIC_MAX).toBe(100);
    const sum = RUBRIC.reduce((a, d) => a + d.points, 0);
    expect(sum).toBe(100);
  });

  it("titleForScore maps bands sensibly", () => {
    expect(titleForScore(95)).toBe("Closer");
    expect(titleForScore(40)).toBe("Happy Ears");
  });
});

describe("parseVerdict", () => {
  const good = JSON.stringify({
    score: 62, title: "Operator",
    dimensions: { discovery: 16, signal: 10, objection: 18, value: 11, listening: 7 },
    bestLine: "What did the last rollout cost you in credibility?",
    worstLine: "So what keeps you up at night?",
    roast: "You found the bruise and asked about the weather.",
    didDetectSignal: true, didHandleObjection: false,
  });

  it("parses clean JSON", () => {
    const v = parseVerdict(good);
    expect(v.score).toBe(62);
    expect(v.dimensions.objection).toBe(18);
  });

  it("extracts JSON wrapped in prose / fences", () => {
    const v = parseVerdict("Here you go:\n```json\n" + good + "\n```\nDone.");
    expect(v.title).toBe("Operator");
  });

  it("clamps score to 0–100 and fills missing dimensions with 0", () => {
    const v = parseVerdict(JSON.stringify({ score: 250, title: "X", dimensions: { discovery: 5 }, bestLine: "a", worstLine: "b", roast: "c", didDetectSignal: false, didHandleObjection: false }));
    expect(v.score).toBe(100);
    expect(v.dimensions.listening).toBe(0);
  });

  it("throws on unparseable input", () => {
    expect(() => parseVerdict("no json here")).toThrow();
  });
});
