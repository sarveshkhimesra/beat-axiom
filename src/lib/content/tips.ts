import { StageNumber } from "../types";

// Tips shown on the PROJECTOR during a round. Normal tips are general nudges;
// the SECRET clue (red, projector-only) is a real, valuable insight for that
// round — teams that watch the screen and act on it score higher.
export interface RoundTips {
  normal: string[];
  secret: string;
}

export const ROUND_TIPS: Record<StageNumber, RoundTips> = {
  1: {
    normal: [
      "Ask what's actually breaking — and get the number.",
      "Find out who owns the payments budget.",
      "Ask how a decision this size gets approved.",
      "Probe what the problem costs them every month.",
      "Ask what happens if they do nothing for six months.",
    ],
    secret:
      "A Series B raise is ~8 months out. Consolidating to one clean, auditable stack is secretly what wins here — name it and you'll stand apart.",
  },
  2: {
    normal: [
      "Ask what a 'great checkout' actually means to her.",
      "Find out how stretched her engineering team is.",
      "Ask what product innovation she actually wants.",
      "Probe the cart-abandonment number on big carts.",
    ],
    secret:
      "NovaBrand's REAL checkout is live — and it's leaking conversion. Ask the person in the room for the link, inspect the flow yourself, and name the exact gaps + fixes. Spot them and you score big. (Also: Meera's real blocker is TEAM BANDWIDTH.)",
  },
  3: {
    normal: [
      "Ask about uptime and p99 latency at their scale.",
      "Probe idempotency and retry handling.",
      "Ask about the 2am incident / on-call path.",
      "Find out their real transaction volume and growth.",
    ],
    secret:
      "Ankit gives the technical green light to the CFO. Win him on concrete reliability specifics and you carry real weight into the Finance round.",
  },
  4: {
    normal: [
      "Ask what pricing range actually wins.",
      "Probe which deal structures he'd value.",
      "Tie your ROI to real rupees, not adjectives.",
      "Ask how this deal reads to investors.",
    ],
    secret:
      "A creative structure (AMC + transaction, a banking tie-up, marketing-spend, or a strategic partnership) beats a low flat rate — and frame it for the Series B.",
  },
  5: {
    normal: [
      "Connect all four rounds into one story.",
      "Answer the CEO: why you, and why now.",
      "Speak to each leader's concern, not just one.",
      "Close with a clear three-year vision.",
    ],
    secret:
      "Naina is betting on a 3-year partner, not a point fix. The team that ties payments + product + tech + commercials into one trajectory wins.",
  },
};
