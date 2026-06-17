import { describe, it, expect } from "vitest";
import { percentileFromRank } from "./percentile";

describe("percentileFromRank", () => {
  it("returns 0 for the very first player (no one to beat yet)", () => {
    expect(percentileFromRank(0, 1)).toBe(0);
  });
  it("top of 100 players is ~99", () => {
    expect(percentileFromRank(99, 100)).toBe(99);
  });
  it("bottom of 100 is ~0", () => {
    expect(percentileFromRank(0, 100)).toBe(0);
  });
  it("middle of 101 is ~50", () => {
    expect(percentileFromRank(50, 101)).toBe(50);
  });
});
