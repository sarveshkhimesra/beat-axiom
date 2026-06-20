import { describe, it, expect } from "vitest";
import {
  joinSpoken,
  combineSegments,
  liveText,
  committedText,
  type ResultSegment,
} from "./transcript";

describe("joinSpoken", () => {
  it("inserts exactly one space between base and spoken", () => {
    expect(joinSpoken("hello", "world")).toBe("hello world");
  });

  it("does not double the space when base already ends with one", () => {
    expect(joinSpoken("hello ", "world")).toBe("hello world");
  });

  it("returns base unchanged when spoken is empty/whitespace", () => {
    expect(joinSpoken("hello", "")).toBe("hello");
    expect(joinSpoken("hello", "   ")).toBe("hello");
  });

  it("returns spoken alone when base is empty", () => {
    expect(joinSpoken("", "world")).toBe("world");
  });
});

describe("combineSegments", () => {
  it("splits final and interim segments with single spaces", () => {
    const segs: ResultSegment[] = [
      { transcript: "I want", isFinal: true },
      { transcript: "to have a", isFinal: true },
      { transcript: "quick", isFinal: false },
    ];
    expect(combineSegments(segs)).toEqual({
      finalized: "I want to have a",
      interim: "quick",
    });
  });
});

describe("liveText — no runaway duplication (the IMG_3500 bug)", () => {
  // Reproduces the reported failure: in continuous mode `e.results` grows on
  // every event and was being re-appended onto a base that already contained
  // it, yielding "...quickhi I want to have a quickhi I want to have a quick
  // discussionhi...". With an immutable base snapshot this can never happen.
  it("growing results never duplicate the finalized phrase", () => {
    const base = ""; // empty input box when the user starts speaking
    const sessionFinalized = ""; // first instance, nothing accumulated yet

    // Simulate the recognition engine emitting progressively longer results.
    const steps = [
      { final: "I want", interim: "to" },
      { final: "I want to have a", interim: "quick" },
      { final: "I want to have a quick discussion", interim: "with you" },
    ];

    const outputs = steps.map((s) =>
      liveText(base, sessionFinalized, s.final, s.interim)
    );

    expect(outputs[0]).toBe("I want to");
    expect(outputs[1]).toBe("I want to have a quick");
    expect(outputs[2]).toBe("I want to have a quick discussion with you");

    // The phrase must appear exactly once — the hallmark of the old bug was
    // the same phrase repeating many times in a single output string.
    for (const out of outputs) {
      const occurrences = out.split("I want to have a").length - 1;
      expect(occurrences).toBeLessThanOrEqual(1);
    }
  });

  it("feeding prior output back as base would have caused the bug — base stays immutable instead", () => {
    // This asserts the contract that prevents the bug: liveText derives from a
    // FIXED base. If a caller (incorrectly) passed the previous output back in
    // as base, duplication would compound — so the hook must never do that.
    const base = "";
    const out1 = liveText(base, "", "I want to have a quick discussion", "");
    // Correct: same immutable base on the next event => no growth.
    const out2 = liveText(base, "", "I want to have a quick discussion", "");
    expect(out2).toBe(out1);
    expect(out2).toBe("I want to have a quick discussion");
  });

  it("appends after pre-existing typed text exactly once", () => {
    const base = "My opening offer is";
    expect(liveText(base, "", "ten thousand", "dollars")).toBe(
      "My opening offer is ten thousand dollars"
    );
  });
});

describe("session accumulation across browser auto-restarts", () => {
  // The browser kills recognition after ~60s; the hook auto-restarts and
  // `e.results` resets. The session accumulator must preserve earlier speech
  // and the new instance must append after it — not overwrite or duplicate.
  it("carries finalized text across a restart and appends cleanly", () => {
    const base = "";

    // Instance 1 finalizes some text, then the browser ends it.
    const inst1Final = "first part of the pitch";
    const committedAfterInst1 = committedText(base, "", inst1Final);
    expect(committedAfterInst1).toBe("first part of the pitch");

    // sessionFinalized now carries instance 1's output (base excluded).
    const sessionFinalized = committedText("", "", inst1Final);

    // Instance 2 starts fresh (results reset) and finalizes more text.
    const inst2Final = "second part of the pitch";
    const live = liveText(base, sessionFinalized, inst2Final, "now");
    expect(live).toBe(
      "first part of the pitch second part of the pitch now"
    );

    const committedAfterInst2 = committedText(base, sessionFinalized, inst2Final);
    expect(committedAfterInst2).toBe(
      "first part of the pitch second part of the pitch"
    );

    // Neither phrase is duplicated.
    expect(committedAfterInst2.split("first part").length - 1).toBe(1);
    expect(committedAfterInst2.split("second part").length - 1).toBe(1);
  });
});
