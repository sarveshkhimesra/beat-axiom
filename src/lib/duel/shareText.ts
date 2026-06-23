import { Verdict } from "./types";
import { RAHUL_MENTION_LINKEDIN, RAHUL_MENTION_TWITTER } from "./config";

const GAME_URL = "https://beat-axiom.vercel.app";

export function buildLinkedInShareText(verdict: Verdict): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 100 ? roast.slice(0, 97).trimEnd() + "…" : roast;
  return [
    `Just played Beat AXIOM — the AI sales game ${RAHUL_MENTION_LINKEDIN} built — and scored ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `AXIOM's take: "${snippet}"`,
    "",
    `10 minutes. 1 AI buyer. Can you beat my score?`,
    GAME_URL,
  ].join("\n");
}

export function buildTwitterShareText(verdict: Verdict): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 80 ? roast.slice(0, 77).trimEnd() + "…" : roast;
  return [
    `Beat AXIOM gave me ${verdict.score}/100 ("${verdict.title}") — ${RAHUL_MENTION_TWITTER}'s AI sales game.`,
    "",
    `"${snippet}"`,
    "",
    `Can you beat me?`,
    GAME_URL,
  ].join("\n");
}
