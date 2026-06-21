import type { Stage, V2Verdict, StageScores } from "./types";

export interface RubricDimension {
  key: string;
  label: string;
  maxPoints: number;
}

export const STAGE_RUBRIC: Record<Stage, RubricDimension[]> = {
  discovery: [
    { key: "painDepth", label: "Pain depth", maxPoints: 15 },
    { key: "stakeholders", label: "Stakeholder mapping", maxPoints: 10 },
    { key: "impact", label: "Impact quantification", maxPoints: 10 },
    { key: "hiddenPriority", label: "Hidden priority progress", maxPoints: 15 },
  ],
  pitch: [
    { key: "tailoring", label: "Tailoring to discovery", maxPoints: 15 },
    { key: "weakness", label: "Weakness handling", maxPoints: 10 },
    { key: "value", label: "Value quantification", maxPoints: 10 },
    { key: "differentiation", label: "Differentiation", maxPoints: 10 },
  ],
  negotiate: [
    { key: "objection", label: "Objection handling", maxPoints: 15 },
    { key: "concessions", label: "Concession trading", maxPoints: 10 },
    { key: "structure", label: "Deal structure", maxPoints: 10 },
    { key: "margin", label: "Margin discipline", maxPoints: 10 },
  ],
  close: [
    { key: "ask", label: "Clear ask", maxPoints: 10 },
    { key: "urgency", label: "Urgency framing", maxPoints: 10 },
    { key: "hesitation", label: "Handling final hesitation", maxPoints: 10 },
    { key: "nextSteps", label: "Next steps", maxPoints: 10 },
  ],
};

export const TOTAL_RAW = Object.values(STAGE_RUBRIC)
  .flat()
  .reduce((a, d) => a + d.maxPoints, 0);

export function normalizeScore(raw: number): number {
  return Math.round(Math.max(0, Math.min(100, (raw / TOTAL_RAW) * 100)));
}

interface TitleBand {
  min: number;
  title: string;
}

const TITLE_BANDS: TitleBand[] = [
  { min: 90, title: "Closer" },
  { min: 75, title: "Operator" },
  { min: 60, title: "Contender" },
  { min: 45, title: "Happy Ears" },
  { min: 30, title: "The Brochure" },
  { min: 0, title: "Meeting Cancelled" },
];

export function titleForScore(score: number): string {
  return TITLE_BANDS.find((b) => score >= b.min)!.title;
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("no JSON in verdict");
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced JSON in verdict");
}

function clamp(n: unknown, lo: number, hi: number): number {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

export function parseV2Verdict(raw: string): V2Verdict {
  const obj = JSON.parse(extractJsonObject(raw));
  const score = clamp(obj.score, 0, 100);
  const ss = obj.stageScores ?? {};
  const stageScores: StageScores = {
    discovery: ss.discovery ?? {},
    pitch: ss.pitch ?? {},
    negotiate: ss.negotiate ?? {},
    close: ss.close ?? {},
  };
  const m = obj.modifiers ?? {};
  return {
    score,
    title: (obj.title && String(obj.title).trim()) || titleForScore(score),
    stageScores,
    modifiers: {
      efficiency: typeof m.efficiency === "number" ? m.efficiency : 0,
      hiddenPriority: typeof m.hiddenPriority === "number" ? m.hiddenPriority : 0,
      walkaway: m.walkaway === true,
      genericPenalty: typeof m.genericPenalty === "number" ? m.genericPenalty : 0,
      prematurePitch: typeof m.prematurePitch === "number" ? m.prematurePitch : 0,
    },
    bestLine: String(obj.bestLine ?? "").trim(),
    worstLine: String(obj.worstLine ?? "").trim(),
    roast: String(obj.roast ?? "").trim(),
    stagesSummary: String(obj.stagesSummary ?? "").trim(),
    didDetectSignal: obj.didDetectSignal === true,
    buyerWalkedAway: obj.buyerWalkedAway === true,
  };
}
