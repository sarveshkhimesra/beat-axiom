import { CompanyId } from "../types";

// An intel fact a team is handed before the game. Each fact has a TRUE value
// and a plausible DECOY (planted falsehood). Teams don't know which they got —
// they must verify by asking the personas (who always tell the truth) in the
// questions phase. Pitching on a decoy you never checked = a weaker pitch.
export interface IntelFact {
  id: string;
  label: string;
  truth: string;
  decoy: string;
}

// ── Customer / persona intel (about NovaBrand and its decision makers) ──────
// 8 facts. Each team has ~25% (2) flipped to their decoy, balanced across teams.
export const CUSTOMER_INTEL_FACTS: IntelFact[] = [
  {
    id: "main_pain",
    label: "NovaBrand's biggest payment problem",
    truth: "Online checkout fails ~11% of the time (industry avg 3.8%) — about ₹6Cr/month in lost revenue.",
    decoy: "Their biggest problem is offline POS reliability across their 80 retail stores.",
  },
  {
    id: "kavya_priority",
    label: "What Kavya (Payments Ops) cares about most",
    truth: "Fixing the checkout failure rate. She rewards real homework — price is not her lever.",
    decoy: "Getting the lowest possible price — she's under pressure to cut payment costs.",
  },
  {
    id: "budget_owner",
    label: "Who controls the payments budget",
    truth: "Arjun (CFO / co-founder) signs off above ₹1Cr; board approval above ₹3Cr.",
    decoy: "Meera (VP Product) owns the payments budget and makes the final call.",
  },
  {
    id: "meera_priority",
    label: "What Meera (VP Product) optimizes for",
    truth: "Checkout conversion and fast, clean integration — developer experience matters to her.",
    decoy: "Offline store expansion — she's focused on the 220 new stores rolling out.",
  },
  {
    id: "ankit_priority",
    label: "What Ankit (CTO) judges vendors on",
    truth: "API reliability, latency at scale, idempotency on retries, and a real on-call path.",
    decoy: "Lowest integration cost — he just wants the cheapest technical option.",
  },
  {
    id: "arjun_hotbutton",
    label: "Arjun's (CFO) hot button",
    truth: "ROI in basis points and rupees, framed for the Series B fundraise story.",
    decoy: "International expansion — he wants a partner who can support global markets.",
  },
  {
    id: "timeline",
    label: "Their timeline pressure",
    truth: "Series B raise in ~8 months; they want consolidation done well before diligence.",
    decoy: "No urgency — they're casually evaluating and won't decide for a year.",
  },
];

// ── Rival intel (what a team has 'heard' about each competing company) ──────
// A team sees rival intel for every company EXCEPT its own. ~1 is flipped.
export const RIVAL_INTEL: Record<CompanyId, IntelFact> = {
  BLADESTACK: {
    id: "rival_BLADESTACK",
    label: "BladeStack",
    truth: "Best API and developer experience; enterprise credibility is thinner.",
    decoy: "Rock-solid enterprise track record with India's largest retailers.",
  },
  ORBISGLOBAL: {
    id: "rival_ORBISGLOBAL",
    label: "OrbisGlobal",
    truth: "Strong cross-border and BNPL; onboarding is slow (~3 months).",
    decoy: "Fastest onboarding in the market — live in under two weeks.",
  },
  VAULTBRIDGE: {
    id: "rival_VAULTBRIDGE",
    label: "VaultBridge",
    truth: "Unbeatable compliance and uptime; product UX feels dated.",
    decoy: "Sleek, modern checkout experience built for consumer brands.",
  },
  FLOWX: {
    id: "rival_FLOWX",
    label: "FlowX",
    truth: "Cheapest with fast T+1 settlement; weak brand and thin enterprise support.",
    decoy: "Premium-priced with the deepest enterprise support team in the market.",
  },
  TERRATAP: {
    id: "rival_TERRATAP",
    label: "TerraTap",
    truth: "Offline POS leader; its online product is newer and secondary.",
    decoy: "Online-first platform with best-in-class checkout conversion.",
  },
  NEXUSPAY: {
    id: "rival_NEXUSPAY",
    label: "NexusPay",
    truth: "Orchestration layer that lifts success rates; doesn't settle on its own — sits on top of other PGs.",
    decoy: "A full-stack processor that replaces your entire payment setup end to end.",
  },
};

const ALL_COMPANY_IDS: CompanyId[] = [
  "BLADESTACK",
  "ORBISGLOBAL",
  "VAULTBRIDGE",
  "FLOWX",
  "TERRATAP",
  "NEXUSPAY",
];

// Deterministically choose which fact ids are shown as DECOY to a given team.
// Balanced: every team gets exactly 2 customer-fact decoys + 1 rival decoy.
// Different per team (rotating window) so no two teams see an identical sheet,
// and no team is structurally disadvantaged.
export function computeIntelFlips(teamIndex: number, ownCompany: CompanyId | null): string[] {
  const flips: string[] = [];
  const n = CUSTOMER_INTEL_FACTS.length;
  // Two customer facts, rotated by team: indices teamIndex and teamIndex+4 (mod n).
  flips.push(CUSTOMER_INTEL_FACTS[teamIndex % n].id);
  flips.push(CUSTOMER_INTEL_FACTS[(teamIndex + Math.floor(n / 2)) % n].id);

  // One rival decoy, chosen from the companies that are NOT this team's own.
  const rivals = ALL_COMPANY_IDS.filter((c) => c !== ownCompany);
  if (rivals.length > 0) {
    flips.push(`rival_${rivals[teamIndex % rivals.length]}`);
  }
  return Array.from(new Set(flips));
}

// Render a fact for a team: decoy if flipped, otherwise the truth.
export function intelValueFor(fact: IntelFact, flips: string[]): string {
  return flips.includes(fact.id) ? fact.decoy : fact.truth;
}
