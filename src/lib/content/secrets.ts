// The four GAME SECRETS. Each is revealed on the PROJECTOR in an inter-round
// gap — secret for Round N appears after Round N-1 ends, before Round N starts.
// There is no secret before Round 1. Teams who watch the screen and act on the
// secret in the upcoming round score big (see scoringHint, fed to AXIOM).
//
// Reveal map:
//   after R1 -> before R2 (Product) : CHECKOUT   — inspect the live checkout
//   after R2 -> before R3 (Tech)    : FDE        — forward-deployed engineers
//   after R3 -> before R4 (Finance) : INVESTOR   — shared investor / board (Mayur)
//   after R4 -> before R5 (Final)   : COMPETITOR — a true/false rumor about the rival

export type SecretRound = 2 | 3 | 4 | 5;

export interface GameSecret {
  id: string;
  forRound: SecretRound;
  badge: string; // short projector tag
  headline: string; // the secret line shown on the projector
  color: string; // distinct accent so a secret reads differently from normal tips
  scoringHint: string; // injected into AXIOM's eval prompt for that round
}

export const GAME_SECRETS: Record<SecretRound, GameSecret> = {
  2: {
    id: "checkout",
    forRound: 2,
    badge: "SECRET // CHECKOUT",
    color: "#ff3d3d",
    headline:
      "NovaBrand's real checkout is LIVE — and it's leaking conversion. Ask AXIOM for the link, inspect the flow yourself, and name the exact gaps + the fixes. Teams who actually do this score big.",
    scoringHint:
      "Award +2 points for EACH distinct checkout gap a team correctly names with its fix (six gaps total — failed-payment dead-end, card-default/UPI-hidden, no saved cards, offers-not-auto-applied, no saved address/pre-fill, errors-only-on-submit), up to +12. This is elite hands-on discovery.",
  },
  3: {
    id: "fde",
    forRound: 3,
    badge: "SECRET // ENGINEERING",
    color: "#ff8a00",
    headline:
      "Their engineering team is stretched dangerously thin. The team that offers FORWARD-DEPLOYED ENGINEERS — your own people doing the integration FOR them, near-zero lift on their side — wins this round.",
    scoringHint:
      "Reward highly any team that offers to put forward-deployed engineers on-site / absorb NovaBrand's integration effort so their thin team does almost nothing. Naming this directly is a standout move.",
  },
  4: {
    id: "investor",
    forRound: 4,
    badge: "SECRET // BOARDROOM",
    color: "#ffd166",
    headline:
      "NovaBrand and your company share an investor — and a common board member, Mayur. The team that surfaces this and proposes a bigger strategic partnership on the back of it stands far apart.",
    scoringHint:
      "Reward highly any team that references the shared investor / common board member (Mayur) and reframes the deal as a larger strategic partnership rather than a vendor purchase.",
  },
  5: {
    id: "competitor",
    forRound: 5,
    badge: "SECRET // RIVAL INTEL",
    color: "#b388ff",
    headline:
      "Intel just came in about the rival still standing across the table. It may be true. It may be a plant. Use it only as far as you trust it — bet right and it wins the room, bet wrong and it costs you.",
    scoringHint:
      "A competitor rumor was shown before this final round and may be true OR false. Reward a team that used competitor intel with sharp, strategic judgement; PENALISE a team that built its pitch on an unverifiable competitor claim as if it were certain fact.",
  },
};

export function secretForRound(round: number): GameSecret | undefined {
  return (GAME_SECRETS as Record<number, GameSecret | undefined>)[round];
}
