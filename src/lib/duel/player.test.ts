// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createPlayer, getPlayer, recordGame } from "./player";

describe("player (localStorage)", () => {
  beforeEach(() => { window.localStorage.clear(); });

  it("creates and retrieves a player", () => {
    createPlayer("Sarvesh");
    const p = getPlayer();
    expect(p?.username).toBe("Sarvesh");
    expect(p?.games).toHaveLength(0);
  });

  it("records games", () => {
    createPlayer("Test");
    recordGame({ templateId: "skeptical-vp", score: 72, title: "Operator", shareId: "abc" });
    const p = getPlayer();
    expect(p?.games).toHaveLength(1);
    expect(p?.games[0].score).toBe(72);
  });

  it("caps history at 50 games", () => {
    createPlayer("Test");
    for (let i = 0; i < 55; i++) {
      recordGame({ templateId: "skeptical-vp", score: i, title: "X", shareId: `id${i}` });
    }
    const p = getPlayer();
    expect(p?.games.length).toBeLessThanOrEqual(50);
  });
});
