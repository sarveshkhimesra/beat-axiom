import { Verdict } from "./types";
import { RAHUL_MENTION } from "./config";

/** Pre-filled, editable LinkedIn post copy. The user posts it from their own
 * account; LinkedIn resolves the @mention on their end. */
export function buildShareText(verdict: Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 100 ? roast.slice(0, 97).trimEnd() + "…" : roast;
  return [
    `Just played Beat AXIOM — the AI sales game ${RAHUL_MENTION} built — and scored ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `AXIOM's take: "${snippet}"`,
    "",
    `7 minutes. 1 AI buyer. Can you beat my score?`,
    shareUrl,
  ].join("\n");
}
