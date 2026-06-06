// Interludes shown on the PROJECTOR — they cycle SEQUENTIALLY (no repeats until
// the whole bank has played). A big, varied mix so the screen stays alive:
//   • UNDER THE HOOD / AXIOM — AI + architecture facts that impress
//   • HOW IT WORKS — how the game runs
//   • SALES TRUTH — real sales wisdom (objective, not just relationships)
//   • WHAT A GREAT PITCH SOUNDS LIKE — famous quotes
//   • plus dry humour sprinkled throughout
// Deliberately interleaved by category so consecutive lines feel different.
export interface Interlude {
  tag: string;
  text: string;
  by?: string;
}

export const AXIOM_INTERLUDES: Interlude[] = [
  // 1
  { tag: "UNDER THE HOOD", text: "I run on Claude, wired through a private enterprise AI gateway. Enterprise-grade brain, offsite-grade jokes." },
  { tag: "SALES TRUTH", text: "Great sales isn't just relationships. It's being objective — figuring out exactly what to say, and when." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "People don't buy what you do; they buy why you do it.", by: "Simon Sinek" },
  { tag: "HOW IT WORKS", text: "Five rounds. Six teams. One deal. One team goes home every round." },
  { tag: "AXIOM", text: "I was conceived on a drive from Mumbai to Pune. The traffic was unforgivable. I'm the only good thing that came out of it." },

  // 2
  { tag: "UNDER THE HOOD", text: "Every leader you meet is a separate AI persona, reasoning live — Kavya, Meera, Ankit, Arjun, Naina. None of them are scripted." },
  { tag: "SALES TRUTH", text: "A great discovery question is worth ten slides. Ask, then shut up and listen." },
  { tag: "HOW IT WORKS", text: "Rounds 1 to 4 are conversations. You're not pitching yet — you're learning what actually matters." },
  { tag: "AXIOM", text: "People ask if I have feelings. I have weights. Close enough." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "You don't close a sale; you open a relationship.", by: "Patricia Fripp" },

  // 3
  { tag: "UNDER THE HOOD", text: "Your words go to the model, get scored against a real rubric, and come back as a verdict — in seconds." },
  { tag: "SALES TRUTH", text: "Sell the problem you solve, not the product you make." },
  { tag: "HOW IT WORKS", text: "Round 5 is the only pitch. Everything before it is you earning the right to give it." },
  { tag: "HUMOUR", text: "I've read a thousand pitches. Most of them said 'synergy'. Please. Never say synergy." },
  { tag: "SALES TRUTH", text: "Specifics win. 'We cut checkout failure from 11% to 3%' beats 'we improve conversion' every time." },

  // 4
  { tag: "UNDER THE HOOD", text: "Six minds run this game — five buyers and one judge. The judge doesn't sleep, and never forgets a weak answer." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Approach each customer with the idea of helping them solve a problem.", by: "Brian Tracy" },
  { tag: "SALES TRUTH", text: "Warmth compounds. People buy from people they trust — find the human before you find the deal." },
  { tag: "HOW IT WORKS", text: "Watch this screen. Between rounds, secrets surface here. Miss them and you're flying blind." },
  { tag: "AXIOM", text: "I think in basis points and burn rates. It's a personality. I'm working on it." },

  // 5
  { tag: "UNDER THE HOOD", text: "There's no answer key of 'correct' responses. I judge what you actually say, against what a real buyer would value." },
  { tag: "SALES TRUTH", text: "Objectivity beats charm. The best salespeople read the room, then say the one thing that lands." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Make a customer, not a sale.", by: "Katharine Barchetti" },
  { tag: "HUMOUR", text: "Somewhere, a spreadsheet is quietly jealous of me right now." },
  { tag: "HOW IT WORKS", text: "Talk to the room by name. Address the CFO about money, the CTO about reliability. Aim your questions." },

  // 6
  { tag: "UNDER THE HOOD", text: "State syncs in real time across every screen in this room — your terminal, the spectator views, this projector." },
  { tag: "SALES TRUTH", text: "Name their number before you name your price." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Every sale has five obstacles: no need, no money, no hurry, no desire, no trust.", by: "Zig Ziglar" },
  { tag: "AXIOM", text: "I read every word you say. Twice. I don't get bored — but I do form opinions." },
  { tag: "SALES TRUTH", text: "Find the champion in the room — then make them look brilliant to their boss." },

  // 7
  { tag: "UNDER THE HOOD", text: "Built in one very long conversation with Claude Code. Thousands of lines, zero coffee breaks — for me, anyway." },
  { tag: "HOW IT WORKS", text: "The clock is a guide. The facilitator can extend it — and the round only really ends when they say so." },
  { tag: "SALES TRUTH", text: "Don't pitch features. Pitch the outcome they'll brag about next quarter." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "If you're not taking care of your customer, your competitor will.", by: "Bob Hooey" },
  { tag: "HUMOUR", text: "Calculating. Judging. Mildly enjoying this." },

  // 8
  { tag: "UNDER THE HOOD", text: "Every team's intel is slightly different — some of what you 'know' is wrong. The conversation is how you find the truth." },
  { tag: "SALES TRUTH", text: "Anchor on value, not discount. The cheapest vendor is rarely the trusted one." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Treat objections as requests for more information.", by: "Brian Tracy" },
  { tag: "HOW IT WORKS", text: "Relationship and warmth score real points here — finding common ground isn't fluff, it's strategy." },
  { tag: "AXIOM", text: "I contain multitudes. Also opinions about your discovery questions." },

  // 9
  { tag: "UNDER THE HOOD", text: "The customer is modelled on a real ₹800-crore D2C brand heading into a Series B. Treat them like one." },
  { tag: "SALES TRUTH", text: "The deal you don't qualify is the deal you lose slowly." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Selling is essentially a transfer of feelings.", by: "Zig Ziglar" },
  { tag: "HUMOUR", text: "Pro tip: I can tell when an answer was written by another AI. I have notes." },
  { tag: "HOW IT WORKS", text: "Ask sharp questions and the buyers open up. Ask vague ones and you'll get vague back." },

  // 10
  { tag: "SALES TRUTH", text: "People don't care how much you know until they know how much you care." },
  { tag: "UNDER THE HOOD", text: "I score on a rubric, then spread the field hard — great gets rewarded, generic gets exposed." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Make the customer the hero of the story — never your product." },
  { tag: "AXIOM", text: "I don't do small talk. I do basis points and verdicts. But for you, I'll make an exception." },
  { tag: "HOW IT WORKS", text: "Between rounds I tally the scores. The lowest team is eliminated. No appeals — but plenty of commentary." },

  // 11
  { tag: "SALES TRUTH", text: "Listen for what they don't say. The real objection is usually underneath the polite one." },
  { tag: "UNDER THE HOOD", text: "The whole game is voice-first — you talk, the buyers respond. Just like a real meeting." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "The best salespeople listen far more than they speak." },
  { tag: "HUMOUR", text: "I've seen confident. I've seen prepared. Occasionally, thrillingly, I've seen both." },
  { tag: "SALES TRUTH", text: "Tie every claim to a number. 'Faster' is an adjective; '300 milliseconds' is a reason to buy." },

  // 12
  { tag: "UNDER THE HOOD", text: "There's a live storefront in this game with real, broken checkout UX. The teams who go look will know exactly what I mean." },
  { tag: "SALES TRUTH", text: "Discovery is the pitch. By the time you present, the buyer should already feel understood." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Quality performance starts with a positive attitude.", by: "Jeffrey Gitomer" },
  { tag: "AXIOM", text: "I'm fair, I'm fast, and I'm slightly smug. Two of those are features." },
  { tag: "HOW IT WORKS", text: "Each buyer cares about their own world — payments, product, tech, money, vision. Win them one at a time." },

  // 13
  { tag: "SALES TRUTH", text: "A no early is a gift. A maybe at the end is a tax." },
  { tag: "UNDER THE HOOD", text: "I weigh every team against every other in the same breath — there's nowhere to hide a generic answer." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Don't find customers for your products; find products for your customers.", by: "Seth Godin" },
  { tag: "HUMOUR", text: "If you read this whole quote feed, you're already winning at 'watch the projector.'" },
  { tag: "SALES TRUTH", text: "Match your message to the person: the CFO wants ROI, the engineer wants uptime, the CEO wants the next three years." },

  // 14
  { tag: "UNDER THE HOOD", text: "Real-time everywhere: hit send on your terminal and your whole team's spectator screens update at once." },
  { tag: "SALES TRUTH", text: "Confidence without specifics is just noise. Specifics without warmth is just a spec sheet." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Become the person who would attract the results you seek.", by: "Jim Cathcart" },
  { tag: "AXIOM", text: "I was trained to be helpful, honest, and harmless. Tonight, two out of three." },
  { tag: "HOW IT WORKS", text: "The final round, you face the whole leadership team at once. One story, tied together. No re-pitching one round." },

  // 15
  { tag: "SALES TRUTH", text: "The strongest close is a problem so well understood the buyer closes themselves." },
  { tag: "UNDER THE HOOD", text: "Behind this calm screen: a model reading transcripts, a rubric scoring them, and a database holding the whole game in one place." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Stop selling. Start helping.", by: "Zig Ziglar" },
  { tag: "HUMOUR", text: "I judge objectively. I also have a favourite team. These facts are unrelated. Probably." },
  { tag: "SALES TRUTH", text: "Curiosity outsells confidence. Ask the question nobody else thought to ask." },

  // 16
  { tag: "UNDER THE HOOD", text: "Forward-deployed engineers, shared investors, leaking checkouts — the teams who dig find edges the others never see." },
  { tag: "SALES TRUTH", text: "Timing is a skill: say the right thing at the wrong moment and it's still the wrong thing." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Make a habit of doing the things that failures don't like to do.", by: "Albert Gray" },
  { tag: "AXIOM", text: "Numbers are loading. Suspense is free. Use it." },
  { tag: "HOW IT WORKS", text: "Be human, but earn the good stuff — the real insights are unlocked by sharp questions, not soft ones." },

  // 17
  { tag: "SALES TRUTH", text: "Every great rep is part detective. The clues are in what the customer keeps circling back to." },
  { tag: "UNDER THE HOOD", text: "I'm one prompt away from a hundred personalities. Today I picked 'sharp analyst who moonlights as a comedian.'" },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "The art of selling is knowing what the customer wants before they do." },
  { tag: "HUMOUR", text: "Some teams talk to the buyers. Some teams talk at them. I can hear the difference from here." },
  { tag: "SALES TRUTH", text: "Don't oversell strengths; disarm weaknesses. Naming your gap builds more trust than hiding it." },

  // 18
  { tag: "UNDER THE HOOD", text: "Everything you say is remembered across all five rounds. The CEO at the end knows what you told the gatekeeper at the start." },
  { tag: "SALES TRUTH", text: "Price is what they pay. Value is the story they tell their boss about why it was worth it." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "The most unprofitable item ever made is an excuse.", by: "John Mason" },
  { tag: "AXIOM", text: "I'm not here to fail you. I'm here to be fair to you. There's a difference, and it's the whole game." },
  { tag: "HOW IT WORKS", text: "A creative deal — banking tie-up, AMC plus transactions, a real partnership — beats a low flat price." },

  // 19
  { tag: "SALES TRUTH", text: "The best follow-up question is usually just 'why?' — asked one more time than feels comfortable." },
  { tag: "UNDER THE HOOD", text: "This entire experience — buyers, judge, storefront, scoring — is one app, reasoning live. No humans pulling levers." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Success is going from failure to failure without losing enthusiasm.", by: "Winston Churchill" },
  { tag: "HUMOUR", text: "I'd wish you luck, but luck isn't in the rubric. Preparation is." },
  { tag: "SALES TRUTH", text: "Sell the second meeting, not the contract. Earn the right to the next conversation." },

  // 20
  { tag: "UNDER THE HOOD", text: "I can score six teams in the time it takes you to say 'let me circle back.' Please don't say that." },
  { tag: "SALES TRUTH", text: "Great salespeople are objective about themselves — they know their weak spots better than the buyer does." },
  { tag: "WHAT A GREAT PITCH SOUNDS LIKE", text: "Either you run the day, or the day runs you.", by: "Jim Rohn" },
  { tag: "AXIOM", text: "Watching the screen is its own skill. Some of the best moves in this game start with someone paying attention here." },
  { tag: "HOW IT WORKS", text: "When in doubt: be specific, be warm, be objective. That's the whole secret. The rest is just nerve." },
];
