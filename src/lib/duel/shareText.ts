import { V2Verdict } from "./types";
import { RAHUL_MENTION } from "./config";

export function buildShareText(verdict: V2Verdict, shareUrl: string): string {
  const roast = verdict.roast.replace(/\s+/g, " ").trim();
  const snippet = roast.length > 140 ? roast.slice(0, 137).trimEnd() + "..." : roast;
  return [
    `AXIOM — the AI ${RAHUL_MENTION} built to grade sales conversations — gave me a ${verdict.score}/100 ("${verdict.title}").`,
    "",
    `Its verdict: "${snippet}"`,
    "",
    `Think you can beat me? ${shareUrl}`,
  ].join("\n");
}
