import { Verdict } from "./types";
import { RAHUL_MENTION_LINKEDIN, RAHUL_MENTION_TWITTER } from "./config";

export function buildLinkedInShareText(verdict: Verdict): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 100 ? roast.slice(0, 97).trimEnd() + "…" : roast;
  return [
    `Just played Beat AXIOM — the AI sales game ${RAHUL_MENTION_LINKEDIN} built — and scored ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `AXIOM's take: "${snippet}"`,
    "",
    `10 minutes. 1 AI buyer. Think you can beat me?`,
  ].join("\n");
}

export function buildTwitterShareText(verdict: Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 80 ? roast.slice(0, 77).trimEnd() + "…" : roast;
  return [
    `Beat AXIOM gave me ${verdict.score}/100 ("${verdict.title}") — ${RAHUL_MENTION_TWITTER}'s AI sales game.`,
    "",
    `"${snippet}"`,
    "",
    `Think you can beat me? ${shareUrl}`,
  ].join("\n");
}
