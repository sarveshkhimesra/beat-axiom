import { Verdict } from "./types";
import { RAHUL_MENTION } from "./config";

/** Pre-filled, editable LinkedIn post copy. The user posts it from their own
 * account; LinkedIn resolves the @mention on their end. */
export function buildShareText(verdict: Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 140 ? roast.slice(0, 137).trimEnd() + "…" : roast;
  return [
    `AXIOM — the AI ${RAHUL_MENTION} built to grade sales conversations — gave me a ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `Its verdict: "${snippet}"`,
    "",
    `Think you can beat me? Take the 5-minute duel 👇`,
    shareUrl,
  ].join("\n");
}
