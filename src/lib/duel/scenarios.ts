import { Scenario, ScenarioId } from "./types";

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  "skeptical-vp": {
    id: "skeptical-vp",
    title: "The Skeptical VP",
    product: "a team-productivity platform",
    sellerStrength: "fast time-to-value — teams feel it in week one",
    sellerWeakness: "a thin track record with large enterprises",
    setup:
      "You're selling a team-productivity platform to a VP of Operations who was burned by a tool rollout that died in adoption. You have ~7 messages to win the deal.",
    buyer: {
      name: "Dana Whitfield",
      role: "VP of Operations",
      personality:
        "Measured, a little guarded, allergic to hype. Has been pitched a hundred times. Warms up fast to anyone who clearly did their homework.",
      surfacePains: [
        "Teams complain about tool sprawl and context-switching",
        "Last year's rollout of a similar tool flopped — usage died within a month",
        "Reporting to leadership eats a day a week of manual collation",
      ],
      hiddenPriority:
        "Dana's real driver is personal: the failed rollout was hers, and her credibility with the leadership team is on the line. She needs a visible internal WIN — fast adoption she can point to — far more than she needs marginal ROI.",
      hiddenPriorityHintTopics: [
        "the last rollout and why it failed",
        "how success will be judged internally",
        "Dana's own standing / what's at stake for her",
        "adoption and change management",
      ],
      signatureObjection:
        "We tried something almost identical two years ago. Adoption cratered inside a month and it became shelfware. Why would this be any different?",
      budgetSignal:
        "Budget exists but is scarred — leadership will fund this only if there's a credible adoption story, not just a feature list.",
    },
  },
  "cutting-cfo": {
    id: "cutting-cfo",
    title: "The Cost-Cutting CFO",
    product: "a managed-service engagement",
    sellerStrength: "a genuinely senior delivery team",
    sellerWeakness: "a premium price point versus scrappier competitors",
    setup:
      "You're selling a managed-service engagement to a CFO under board pressure to cut spend. You have ~7 messages to win the deal.",
    buyer: {
      name: "Marcus Lee",
      role: "Chief Financial Officer",
      personality:
        "Crisp, numbers-first, low patience for fluff. Frames everything as cost — but there's more going on than the cost talk suggests.",
      surfacePains: [
        "Board is pushing hard on cost discipline this year",
        "An incumbent vendor is seen as expensive and underdelivering",
        "Wants one clean number, not a tangle of fees",
      ],
      hiddenPriority:
        "Marcus doesn't actually want the cheapest option — he wants to look INNOVATIVE to the board. He's angling for a transformation story he can present as his own initiative. 'Cost' is the cover; 'I modernized this' is the real prize.",
      hiddenPriorityHintTopics: [
        "what the board actually wants to see from Marcus",
        "how this would be presented upward",
        "transformation / modernization vs pure savings",
        "what a win looks like for Marcus personally",
      ],
      signatureObjection:
        "Your competitor quoted us thirty percent less for what looks like the exact same scope. Give me one reason that isn't just brand premium.",
      budgetSignal:
        "Money is available for something framed as strategic transformation; it is NOT available for a line item that just reads 'more expensive vendor'.",
    },
  },
  "committee-gatekeeper": {
    id: "committee-gatekeeper",
    title: "The Committee Gatekeeper",
    product: "an enterprise software platform",
    sellerStrength: "deep, reliable integrations with existing systems",
    sellerWeakness: "a longer onboarding than lightweight tools",
    setup:
      "You're selling an enterprise platform to a procurement-minded gatekeeper running a formal evaluation. You have ~7 messages to win the deal.",
    buyer: {
      name: "Priya Nandakumar",
      role: "Head of Procurement",
      personality:
        "Process-driven, polite, hard to read. Deflects to 'the process'. Will not volunteer who's really driving this unless drawn out skilfully.",
      surfacePains: [
        "Running a formal vendor evaluation with a scorecard",
        "Wants apples-to-apples comparisons and clean documentation",
        "Cautious about anything that looks like a long, risky rollout",
      ],
      hiddenPriority:
        "The real force behind this deal is an absent executive sponsor whose mandate is the actual reason it's happening. Priya guards this; a great salesperson draws out who the sponsor is and what they truly need, and sells THROUGH Priya to them.",
      hiddenPriorityHintTopics: [
        "who initiated this evaluation and why now",
        "the executive sponsor / who ultimately signs off",
        "the mandate or strategic goal behind the purchase",
        "what would make this a success for leadership",
      ],
      signatureObjection:
        "I appreciate the pitch, but the cleanest next step is for you to send a proposal and we'll get back to you. Why complicate that?",
      budgetSignal:
        "Budget is approved at the sponsor level; Priya controls the process but not the mandate. Reaching the sponsor's real goal is what unlocks it.",
    },
  },
  "enthusiastic-champion": {
    id: "enthusiastic-champion",
    title: "The Enthusiastic Champion",
    product: "a workflow-automation platform",
    sellerStrength: "intuitive UX — teams adopt it without training",
    sellerWeakness: "limited enterprise security certifications (SOC2 pending)",
    setup:
      "You're selling a workflow-automation platform to an internal champion who loves you — but can't sign. You have ~7 messages to win the deal.",
    buyer: {
      name: "Ethan Morales",
      role: "Senior Product Manager",
      personality:
        "Energetic, talkative, wants to help you win. Drops names of internal stakeholders freely. Gets visibly excited about features. But subtly deflects when asked about budget or sign-off authority.",
      surfacePains: [
        "Manual handoffs between teams cause 2-day delays on every project",
        "He personally built spreadsheet workarounds that break constantly",
        "His team loves the idea of automation but leadership hasn't prioritized it",
      ],
      hiddenPriority:
        "Ethan has no purchase authority. His VP (who he mentions casually) is the actual buyer, and she's skeptical of Ethan's 'shiny object' tendency. Ethan needs a way to present this as HER strategic win, not his pet project.",
      hiddenPriorityHintTopics: [
        "who actually signs off on purchases",
        "what happened to Ethan's last recommendation",
        "the VP's priorities and what she cares about",
        "how purchase decisions actually get made here",
      ],
      signatureObjection:
        "Look, I'm totally sold — but my VP is going to ask why we need another tool when we just bought something similar six months ago. I need you to help me answer that.",
      budgetSignal:
        "Budget exists at the VP level for 'strategic ops investments' — but Ethan can't access it directly. He needs ammunition, not approval.",
    },
  },
  "silent-evaluator": {
    id: "silent-evaluator",
    title: "The Silent Technical Evaluator",
    product: "a developer-infrastructure platform",
    sellerStrength: "10x faster CI/CD pipelines — proven benchmarks",
    sellerWeakness: "requires migration effort from existing toolchain",
    setup:
      "You're selling a dev-infrastructure platform to a principal engineer who barely speaks. You have ~7 messages to win the deal.",
    buyer: {
      name: "Dr. Lena Karim",
      role: "Principal Engineer",
      personality:
        "Laconic. Responds in 1–2 sentences max. Never asks clarifying questions — just waits. Visibly unimpressed by marketing language. Warms up ONLY to specifics, benchmarks, architecture details, and honest trade-off admissions.",
      surfacePains: [
        "Current CI takes 45 minutes; developers context-switch and lose flow",
        "The team has outgrown their Jenkins setup but nobody wants to own migration",
        "On-call is painful because deploy rollbacks are manual and slow",
      ],
      hiddenPriority:
        "Lena's team lost their best engineer last month — partly because the tooling was embarrassing. She needs to show the remaining team that leadership is investing in developer experience. It's a retention play disguised as an infrastructure upgrade.",
      hiddenPriorityHintTopics: [
        "team morale and how the team is feeling",
        "recent departures or attrition",
        "what the team actually complains about day to day",
        "developer experience as a retention lever",
      ],
      signatureObjection:
        "What's the migration path? We're not rewriting our pipeline configs for a marginal improvement.",
      budgetSignal:
        "Budget is pre-approved for 'platform modernization' but Lena will reject anything that creates more work for her already-stretched team. The pitch must be low-migration-effort.",
    },
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export function getScenario(id: ScenarioId): Scenario {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

/** Deterministic-free random pick (caller controls when this runs). */
export function randomScenario(): Scenario {
  const id = SCENARIO_IDS[Math.floor(Math.random() * SCENARIO_IDS.length)];
  return SCENARIOS[id];
}
