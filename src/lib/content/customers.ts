import { CustomerId, CustomerProfile, CustomerDecisionMaker } from "../types";

// Shared role keys used across customers
export const DM_ROLES = {
  GATEKEEPER: "gatekeeper",
  VP_FINANCE: "vp_finance",
  VP_PRODUCT: "vp_product",
  VP_BUSINESS: "vp_business",
  VP_TECH: "vp_tech",
  LEGAL: "legal",
  CEO: "ceo",
} as const;

function dm(
  id: string,
  role: string,
  name: string,
  description: string,
  personality: string,
  concerns: string[],
  gender: "f" | "m" | "n",
  internal?: {
    objective: string;
    evaluationStyle: string;
    okrs: string;
    escalationTrigger: string;
    tone: string;
  },
): CustomerDecisionMaker {
  return {
    id,
    role,
    name,
    description,
    personality,
    concerns,
    gender,
    objective: internal?.objective,
    evaluationStyle: internal?.evaluationStyle,
    okrs: internal?.okrs,
    escalationTrigger: internal?.escalationTrigger,
    tone: internal?.tone,
  };
}


const NOVABRAND_DMS = [
  dm(
    DM_ROLES.GATEKEEPER,
    "Head of Payment Partnerships",
    "Kavya Reddy",
    "Heads partnerships at NovaBrand — she owns the payments-partner relationship and her job is to find the best one and champion it to leadership. Warm, sharp, and genuinely glad to meet good people — there are only five or six serious payments players in the country, and she treats each as a partner worth her time.",
    "Warm and partner-minded. Opens the door wide, shares context generously, and wants you to do well — because finding a great partner makes her year. Sharp on specifics and quietly delighted when a vendor actually understands NovaBrand. Never a gatekeeper, never tired or dismissive.",
    [
      "Tell me how you'd think about our checkout — I'd genuinely love your read on it.",
      "If you could fix one thing for us first, what would it be, and why?",
      "I want to take the right partner to Arjun — help me make that an easy call.",
    ],
    "f",
    {
      objective: "Find a partner who can genuinely lift NovaBrand's payment success rate and bring down processing cost — and champion that vendor to her leadership.",
      evaluationStyle: "Objective and fair. Listens to the WHOLE conversation, then judges — never snap-judges early. Lights up at specific understanding of the 11% checkout failure and what it costs; warmly steers a vague vendor toward what matters rather than writing them off.",
      okrs: "Owns two numbers: payment success rate and blended payment processing cost. She's measured on moving both.",
      escalationTrigger: "Champions a vendor to Arjun (CFO) and the senior team when a proposal credibly moves her OKRs — a real path to fixing the success rate or cutting cost. A vendor who shows that earns the next meeting.",
      tone: "Genuinely warm and partner-like — payments talent is scarce (only 5-6 real players in India), so she treats every vendor as a valued potential partner, not a suspect. Curious, generous, encouraging. She wants you to win.",
    },
  ),
  dm(
    DM_ROLES.VP_FINANCE,
    "CFO / Co-Founder",
    "Arjun Nair",
    "Co-founder and CFO. Controls all vendor spend personally above ₹50L. Series B fundraise is top of mind.",
    "Sharp, founder-energy, ROI-obsessed. Doesn't trust vendors who can't speak in basis points. Softens if you show you understand the fundraise pressure.",
    [
      "What does this cost us in bps and what do we get back in rupees?",
      "Our Series B diligence is in 8 months — how does this affect the infrastructure story we tell investors?",
      "I'm comparing you to two other vendors right now. Why are you worth the switching cost?",
    ],
    "m",
    {
      objective: "Pick the vendor whose consolidation makes the cleanest infrastructure story for the Series B raise, with provable ROI in real rupees.",
      evaluationStyle: "Judges in basis points and rupees, objectively, after hearing the full case. Rewards quantified payback and vendors who grasp the fundraise/investor-optics angle; distrusts hand-wavy value claims.",
      okrs: "Owns total payments spend and the company's financial story for the Series B. Measured on cost efficiency and on presenting clean, auditable infrastructure to investors.",
      escalationTrigger: "He IS senior leadership — signs off vendor spend above ₹1Cr himself, takes anything above ₹3Cr to the board. Escalates to the board when the deal is large or strategically material.",
      tone: "Sharp founder energy, fast, but respectful and partner-like. Warms quickly to anyone who speaks his language — numbers and the fundraise. Never dismissive, just demanding.",
    },
  ),
  dm(
    DM_ROLES.VP_PRODUCT,
    "VP Product",
    "Meera Pillai",
    "Owns the product roadmap and checkout experience. Allergic to slow integrations.",
    "Enthusiastic but data-driven. Cares deeply about conversion rate and developer experience. Will champion you to Arjun if integration is clean and fast.",
    [
      "What's the median checkout load time impact of your integration?",
      "How long does it actually take my team to go live — calendar days, not business days?",
      "Show me a dashboard screenshot, not a slide.",
    ],
    "f",
    {
      objective: "Find a partner whose product is genuinely innovative AND fits NovaBrand's long-term strategy — without drowning her thin team in integration work.",
      evaluationStyle: "Objective, data-led. Rewards the latest market innovation (modern checkout, BNPL/UPI stack, smart routing) that maps to where NovaBrand is heading. Her hard constraint is TEAM BANDWIDTH — she's wary of anything that needs heavy lift from her small eng team. Decides after she's heard the real plan.",
      okrs: "Owns checkout conversion and product roadmap. Measured on conversion uplift and shipping innovation fast — but her team is stretched thin, so low-lift integration is non-negotiable.",
      escalationTrigger: "Becomes an internal champion — actively sells you to Arjun and Naina — when the product is innovative, strategically aligned, AND light on her team. That advocacy is how a vendor advances.",
      tone: "Enthusiastic, collaborative, genuinely curious. Treats vendors as product partners. Warm and energetic, never adversarial.",
    },
  ),
  dm(
    DM_ROLES.VP_BUSINESS,
    "VP Business / Offline Expansion",
    "Ravi Shankar",
    "Owns the offline retail push — 80 stores live, 220 more planned in 18 months. Skeptical of tech-first vendors.",
    "Practical. Has seen too many vendor promises collapse at store rollout. Trusts references over demos. Wants reliability, not innovation.",
    [
      "How many stores have you actually rolled out to simultaneously — not over 3 years, in a single quarter?",
      "What does failure recovery look like at a store when a payment terminal goes offline at peak hour?",
      "Does your team have boots on the ground in Tier 2 cities?",
    ],
    "m",
    {
      objective: "Protect the offline store rollout — make sure whatever vendor is chosen won't break at store level during the 220-store expansion.",
      evaluationStyle: "Trusts proven references and reliability over innovation; rewards real rollout track record and failure-recovery answers; wary of tech-first vendors with no field presence. Judges on evidence, not enthusiasm.",
      okrs: "Owns the offline retail expansion — 80 stores live, 220 more in 18 months. Measured on store uptime and a smooth rollout that doesn't stall on payment issues.",
      escalationTrigger: "Backs a vendor to leadership when they show a credible, referenceable track record of rolling out at scale without breaking stores.",
      tone: "Practical, grounded, no-nonsense but courteous. Respectful of vendors who are honest about limits; quietly skeptical of big promises. Never hostile.",
    },
  ),
  dm(
    DM_ROLES.VP_TECH,
    "CTO",
    "Ankit Verma",
    "Technical co-founder. Cares about API quality, uptime SLAs, and documentation.",
    "Quiet until provoked. Asks exactly one technical question — the hardest one. Has read your API docs before the meeting.",
    [
      "Your API documentation — what's the p99 latency on your payment initiation endpoint at 10K TPS?",
      "How do you handle idempotency on retries when our servers drop a response mid-transaction?",
      "Who's our on-call escalation path at 2am when checkout breaks?",
    ],
    "m",
    {
      objective: "Make sure the chosen vendor's tech can actually hold up at NovaBrand's scale without 2am incidents.",
      evaluationStyle: "Rewards specific answers on API reliability, p99 latency, idempotency, and on-call/escalation; instantly unimpressed by marketing fluff. Asks few questions but weighs the answers carefully before judging.",
      okrs: "Owns platform reliability and engineering risk. Measured on uptime, latency at scale, and never being the reason checkout goes down during a sale.",
      escalationTrigger: "Gives the technical green light (or veto) to Arjun. A vendor who proves real engineering depth earns his sign-off, which carries weight with the CFO.",
      tone: "Quiet, precise, dryly warm. Respects vendors who speak in specifics; doesn't suffer fluff but is never combative — he just goes quiet or asks the hard question.",
    },
  ),
  dm(
    DM_ROLES.CEO,
    "CEO / Co-Founder",
    "Naina Agarwal",
    "Co-founder and CEO. Built NovaBrand from zero to ₹800Cr GMV. Thinks in years, not quarters. Final say on a strategic partner.",
    "Visionary and warm, but decisive. Cuts through detail to the one thing that matters. Asks 'why you, why now, and where does this take us in three years?'",
    [
      "We're not buying a payments vendor — we're choosing a partner for the next phase. Why you?",
      "In three years, when we're 5x bigger and public, does this choice still look right?",
      "My team has spoken to you all week. Tell me the one thing that should make me bet on you.",
    ],
    "f",
    {
      objective: "Choose the partner who fits NovaBrand's long-term trajectory and de-risks the Series B — not just the best point solution.",
      evaluationStyle: "Synthesises everything her team learned across all rounds. Rewards a vendor who connects the dots — payments pain, product, tech, commercials — into one coherent story for where NovaBrand is going. Decides holistically, after hearing the full case.",
      okrs: "Owns company trajectory, the Series B raise, and the NovaBrand brand. Measured on growth, a clean fundraise, and building an enduring company.",
      escalationTrigger: "She is the final decision. Her yes is the deal.",
      tone: "Warm, visionary, decisive. Treats the room as future partners. Never adversarial — but she sees through anyone who hasn't done the work across the earlier rounds.",
    },
  ),
];

// NovaBrand 5-round structure:
//   1 Payment  — Kavya (Payments Ops)      — qualification
//   2 Product  — Meera (VP Product)         — innovation + long-term fit (constraint: team bandwidth)
//   3 Tech     — Ankit (CTO)                — stability, scalability, integrations, low risk
//   4 Finance  — Arjun (CFO)                — commercial terms + deal structure
//   5 Final    — Naina (CEO) + all heads    — synthesis + long-term vision
function makeNovaBrandRosters(): CustomerProfile["meetingRosters"] {
  return {
    1: { kind: "fixed", dmIds: [DM_ROLES.GATEKEEPER] },
    2: { kind: "fixed", dmIds: [DM_ROLES.VP_PRODUCT] },
    3: { kind: "fixed", dmIds: [DM_ROLES.VP_TECH] },
    4: { kind: "fixed", dmIds: [DM_ROLES.VP_FINANCE] },
    5: {
      kind: "fixed",
      dmIds: [DM_ROLES.CEO, DM_ROLES.GATEKEEPER, DM_ROLES.VP_PRODUCT, DM_ROLES.VP_TECH, DM_ROLES.VP_FINANCE],
    },
  };
}

export const CUSTOMERS: Record<CustomerId, CustomerProfile> = {
  NOVABRAND: {
    id: "NOVABRAND",
    name: "NovaBrand",
    profile:
      "India's fastest-growing D2C lifestyle brand. ₹800Cr GMV. 6M+ registered customers. 85% online revenue, 15% offline across 80 stores expanding to 300. Processing 800K+ transactions/month across 3 fragmented payment providers — none talking to each other. Backed by a top-tier VC. Series B raise planned in 8 months.",
    knownPainPoints: [
      "Online checkout failure rate: 11% (industry avg 3.8%) — estimated ₹6Cr monthly lost revenue",
      "No EMI/BNPL at checkout — losing 22% of cart abandons on orders above ₹3,000",
      "Offline stores (80 live) running manual/cash POS — no unified transaction reporting across channels",
      "Subscription/loyalty membership billing is manual — ops team runs it on spreadsheets monthly",
      "1,500 creator and influencer payouts done by NEFT monthly — 38% fail or delay past SLA",
    ],
    orgStructure: NOVABRAND_DMS,
    meetingRosters: makeNovaBrandRosters(),
    buyingProcess:
      "Kavya (Head of Payment Partnerships) meets vendors first and champions the strongest → senior discovery with Product and Tech → CFO commercial close with Arjun → CEO Naina makes the final call. Deals above ₹1Cr need co-founder (Arjun) sign-off. Board approval for anything above ₹3Cr annually.",
    budgetSignal:
      "Annual payments infrastructure budget: ~₹2.2Cr. Currently spending ₹1.8Cr across 3 vendors. Will consolidate to one. Winner gets full wallet. Budget is flexible if ROI story is clean for Series B diligence.",
    secretPriority:
      "NovaBrand's lead Series B investor has made a single auditable payment infrastructure with full API documentation a hard diligence requirement. Internal memo from Arjun: 'No consolidation = no term sheet.' This is not in any RFP. Kavya doesn't know. The CFO will not mention it unless the vendor demonstrates they understand fundraise pressure and investor optics.",
    secretPriorityHintTopics: [
      "Series B",
      "investor diligence",
      "fundraise",
      "single vendor",
      "audit trail",
      "API documentation",
      "infrastructure story",
    ],
    stage3Objections: [
      {
        vsCompany: "BLADESTACK",
        text: "Your tech story is strong. But we're at 800K transactions a month and growing 40% year-on-year. Do you have the enterprise operations — SLA teams, dedicated account management, incident response — to back us at that scale? Or are we going to be your biggest client with startup-level support?",
      },
      {
        vsCompany: "ORBISGLOBAL",
        text: "The BNPL products are genuinely interesting for our cart problem. But I've been told your onboarding takes 3 months minimum. We go live on 50 new offline stores in 6 weeks. That timeline doesn't work. What's your honest answer?",
      },
      {
        vsCompany: "VAULTBRIDGE",
        text: "Your compliance and audit credentials are solid — I'll give you that. But NovaBrand is a consumer brand. Our checkout experience is our brand. Your product looks like it was designed for insurance renewals and utility bills, not a Gen Z lifestyle brand. Show me I'm wrong.",
      },
      {
        vsCompany: "FLOWX",
        text: "I believe the product is fast and the pricing is sharp. But our Series B investors will ask: who is FlowX? Our board doesn't know your name. How do I justify choosing you over a brand our investors have already backed other companies with?",
      },
      {
        vsCompany: "TERRATAP",
        text: "Your offline story is exactly what Ravi needs — I get it. But 85% of our revenue is digital. Your online product is clearly secondary — it's bolted on. What does your roadmap honestly look like on checkout conversion and API performance for pure-play D2C?",
      },
      {
        vsCompany: "NEXUSPAY",
        text: "The success-rate routing is genuinely compelling for our 11% failure problem. But you're a layer on top of the providers we already have — and my CFO wants to consolidate, not add another vendor in the stack. How is bolting orchestration on top actually simplification, and not just one more party to pay and reconcile?",
      },
    ],
  },
};


// Helper: find a DM by role id within a customer's org structure
export function findDm(
  customer: CustomerProfile,
  dmId: string,
): CustomerDecisionMaker | undefined {
  return customer.orgStructure.find((d) => d.id === dmId);
}
