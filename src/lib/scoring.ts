import { StageNumber } from "./types";

export interface RubricDimension {
  key: string;
  label: string;
  points: number;
  fullMarks: string;
}

export interface StageRubric {
  stage: StageNumber;
  title: string;
  weightPct: number;
  eliteBehaviors: string[];
  dimensions: RubricDimension[];
  penalties: string[];
  notes?: string;
}

export const STAGE_RUBRICS: Record<StageNumber, StageRubric> = {
  1: {
    stage: 1,
    title: "PAYMENTS / OPS QUALIFICATION",
    weightPct: 25,
    eliteBehaviors: [
      "Pitch names NovaBrand's real payment problems specifically — proof they asked good questions",
      "Shows they understood what the problem costs the business (lost revenue, failed payouts)",
      "Reflects who owns the budget and how a decision gets approved",
      "Frames why acting now matters — the cost of waiting",
      "Connects their own company's specific strength to NovaBrand's biggest pain",
      "Reads like a tailored pitch, not a generic vendor template",
    ],
    dimensions: [
      { key: "situationGrasp", label: "Understanding of NovaBrand's situation", points: 30, fullMarks: "Pitch names ≥2 of NovaBrand's real problems specifically (checkout failure, BNPL gap, payout delays) — proof they learned it in the room" },
      { key: "budgetChain", label: "Grasp of budget / decision process", points: 25, fullMarks: "Pitch reflects who owns the payments budget and how approval works" },
      { key: "urgency", label: "Urgency framing", points: 20, fullMarks: "Pitch conveys the cost of inaction or the Series B timing pressure" },
      { key: "solutionFit", label: "Solution fit", points: 15, fullMarks: "Connects their company's specific edge to NovaBrand's biggest problem — not generic" },
      { key: "communication", label: "Communication", points: 10, fullMarks: "Clear, specific, persuasive — no generic vendor-speak" },
    ],
    penalties: [
      'Generic pitch that could be sent to any company, no NovaBrand specifics: -10',
    ],
  },
  2: {
    stage: 2,
    title: "PRODUCT — INNOVATION & STRATEGY FIT",
    weightPct: 20,
    eliteBehaviors: [
      "Lead with genuinely current market innovation — modern checkout, BNPL/UPI stack, smart routing, network tokenization",
      "Tie the product to where NovaBrand is heading (online-first growth, scale into Series B), not just today's pain",
      "Respect Meera's hard constraint — her team is thin, so show a low-lift, fast integration",
      "Make a credible checkout-conversion improvement case with specifics",
      "Tailor to what was learned about Product's priorities, not a generic feature list",
    ],
    dimensions: [
      { key: "innovation", label: "Latest market innovation", points: 30, fullMarks: "Pitch leads with genuinely current, differentiated product innovation relevant to NovaBrand — not table-stakes features" },
      { key: "strategyFit", label: "Long-term strategy alignment", points: 25, fullMarks: "Connects the product to NovaBrand's 3-year trajectory (online-first scale, fundraise), not just today's checkout" },
      { key: "bandwidthFit", label: "Fit with team bandwidth", points: 20, fullMarks: "Shows a low-lift, fast integration that respects Meera's stretched team — no heavy eng demand" },
      { key: "conversionImpact", label: "Conversion impact", points: 15, fullMarks: "Credible, specific checkout-conversion / cart-recovery improvement" },
      { key: "communication", label: "Tailored communication", points: 10, fullMarks: "Clearly tailored to Product's priorities, not a generic feature dump" },
    ],
    penalties: [
      "Product story that ignores team bandwidth — demands heavy engineering lift: -10",
      "Table-stakes features pitched as innovation: -5",
    ],
  },
  3: {
    stage: 3,
    title: "TECH — STABILITY, SCALE & RISK",
    weightPct: 20,
    eliteBehaviors: [
      "Prove stability — uptime track record, graceful failure, no 2am incidents",
      "Show it scales at NovaBrand's volume and 40% YoY growth",
      "Make integration concrete — clean APIs, idempotency on retries, real docs",
      "Lower perceived system risk — incident response, on-call, monitoring",
      "Answer the CTO's hard question in specifics, not marketing language",
    ],
    dimensions: [
      { key: "stability", label: "Stability & reliability", points: 25, fullMarks: "Concrete uptime/reliability evidence and graceful-failure story a CTO would trust" },
      { key: "scalability", label: "Scalability", points: 25, fullMarks: "Credibly holds at NovaBrand's TPS and growth — named numbers, not 'we scale'" },
      { key: "integrations", label: "Integration quality", points: 25, fullMarks: "Clean API story: idempotency, retries, real documentation, sane integration path" },
      { key: "riskMitigation", label: "Low system risk", points: 15, fullMarks: "Addresses incident response, on-call/escalation, monitoring — de-risks the switch" },
      { key: "communication", label: "Technical clarity", points: 10, fullMarks: "Specific and credible, no marketing fluff" },
    ],
    penalties: [
      "Marketing fluff instead of technical specifics: -10",
    ],
  },
  4: {
    stage: 4,
    title: "FINANCE — COMMERCIALS & DEAL STRUCTURE",
    weightPct: 25,
    eliteBehaviors: [
      "Land a competitive price — a winning deal sits within ~10% of the lowest bid in the room",
      "Go beyond a flat rate: propose an innovative structure (AMC + transaction pricing, banking partnership to offset cost, marketing-spend arrangement, or a larger strategic partnership)",
      "Quantify ROI in real rupees / basis points using NovaBrand's numbers",
      "Frame the deal as a clean infrastructure story for the Series B raise",
      "Trade concessions for value; close with a concrete next step",
    ],
    dimensions: [
      { key: "commercialTerms", label: "Commercial competitiveness", points: 25, fullMarks: "Price is competitive — a winning bid lands within ~10% of the lowest offer; neither overpriced nor margin-suicide" },
      { key: "dealStructure", label: "Innovative deal structure", points: 25, fullMarks: "Proposes a creative structure — AMC+transaction pricing, banking partnership to lower cost, marketing-spend arrangement, or strategic partnership — not just a flat MDR" },
      { key: "roiCase", label: "ROI / business case", points: 20, fullMarks: "Quantified payback using NovaBrand's real pain metrics" },
      { key: "seriesBFraming", label: "Series B / investor framing", points: 20, fullMarks: "Frames the deal as a clean, auditable infra story for the fundraise" },
      { key: "closeQuality", label: "Close quality", points: 10, fullMarks: "Names a concrete next step, timeline, and commitment ask" },
    ],
    penalties: [
      "A flat price with no structure or creativity: -10",
      "Pricing wildly off the market (far above the field, or margin-destroying): -10",
    ],
  },
  5: {
    stage: 5,
    title: "FINAL — CEO & LEADERSHIP",
    weightPct: 20,
    eliteBehaviors: [
      "Answer the CEO's question: why you, why now, and where does this take NovaBrand in 3 years",
      "Connect every earlier round into one coherent story — payments pain, product, tech, commercials",
      "Show up as a long-term partner, not a vendor closing a deal",
      "Speak to the whole room — acknowledge what each leader cares about",
      "Close with conviction and a clear path forward",
    ],
    dimensions: [
      { key: "vision", label: "Vision & why-you-why-now", points: 30, fullMarks: "Compelling answer to the CEO: a clear reason this is the right partner for the next 3 years" },
      { key: "coherence", label: "Coherent story across rounds", points: 25, fullMarks: "Ties payments, product, tech, and commercials into one consistent narrative" },
      { key: "partnership", label: "Partner, not vendor", points: 20, fullMarks: "Frames a long-term partnership aligned to NovaBrand's journey, not a one-off sale" },
      { key: "trustAcrossRoom", label: "Reads the whole room", points: 15, fullMarks: "Acknowledges what the CEO AND each department head cares about" },
      { key: "closeQuality", label: "Close quality", points: 10, fullMarks: "Confident close with a clear next step" },
    ],
    penalties: [
      "Repeats one round's pitch without connecting the whole story: -10",
    ],
  },
};

export const RESPONSIVENESS_BONUS_MAX_PER_STAGE = 5;
export const CROSS_STAGE_CONSISTENCY_BONUS_MAX = 10;

export function maxDimensionTotal(stage: StageNumber): number {
  return STAGE_RUBRICS[stage].dimensions.reduce((s, d) => s + d.points, 0);
}
