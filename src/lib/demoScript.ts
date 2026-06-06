import { CUSTOMERS } from "./content/customers";
import { CustomerId } from "./types";

export interface DemoStep {
  title: string;
  speech: string;
  body: string;
  badge?: string;
  cue?: "open" | "step" | "close";
}

/**
 * Pre-game demo — narrator is "Rahul's AI agent" introducing the game,
 * the customer, the stages, and how to play on a laptop. Spec §12.
 */
export function buildDemoScript(customerId: CustomerId): DemoStep[] {
  const c = CUSTOMERS[customerId];

  return [
    {
      title: "THE DEAL",
      badge: "// THE SALES CHAMPIONSHIP",
      cue: "open",
      speech: `Ladies and gentlemen... welcome to THE DEAL. The most anticipated contest of the night. Six teams will enter this arena. Only one will walk away with the deal.`,
      body: `The most anticipated contest of the night.`,
    },
    {
      title: "YOUR JUDGE",
      badge: "// THE EVALUATOR",
      cue: "step",
      speech: `I am AXIOM — your evaluator. Rahul runs the room tonight; I weigh every word you say. Charm me, and you rise. Waste my time, and you fall. Nothing gets past me.`,
      body: `I am AXIOM. Rahul runs the room — I score every move.`,
    },
    {
      title: "THE TARGET",
      badge: "// THE PRIZE",
      cue: "step",
      speech: `Your target: ${c.name} — an eight-hundred-crore D2C powerhouse, racing toward a Series B, and hunting for one payments partner to bet on. Win them... and you win everything.`,
      body: `${c.name} — ₹800Cr, Series B incoming, choosing ONE partner.`,
    },
    {
      title: "FIVE ROUNDS",
      badge: "// THE GAUNTLET",
      cue: "step",
      speech: `To win, you must survive five rounds. Payments. Product. Technology. Finance. And at the summit — the CEO herself. One team is eliminated at the end of every single round.`,
      body: `Payments · Product · Tech · Finance · the CEO. One team falls each round.`,
    },
    {
      title: "TALK, THEN PITCH",
      badge: "// HOW IT WORKS",
      cue: "step",
      speech: `The first four rounds, you talk — you uncover what they truly want. But be careful: some of what you've been told is wrong, on purpose. Only the survivors earn the right to make the final pitch.`,
      body: `Four rounds of conversation. Some of your intel is a lie. Then — the final pitch.`,
    },
    {
      title: "THE HIDDEN PRIZE",
      badge: "// ONE SECRET",
      cue: "step",
      speech: `And there is a secret only this screen will ever reveal. Find it, use it, and you will pull ahead of the room. Miss it... and you will never know what beat you.`,
      body: `A secret clue lives only on this screen. Watch it.`,
    },
    {
      title: "LET THE GAME BEGIN",
      badge: "// TAKE YOUR SEATS",
      cue: "close",
      speech: `Six teams. Five rounds. One deal. Players — take your seats. Let the game... begin.`,
      body: `Six teams. Five rounds. One deal.`,
    },
  ];
}
