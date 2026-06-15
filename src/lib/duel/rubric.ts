import { Verdict, VerdictDimensions } from "./types";

export interface RubricDimension {
  key: keyof VerdictDimensions;
  label: string;
  points: number;
  fullMarks: string;
}

export const RUBRIC: RubricDimension[] = [
  { key: "discovery", label: "Discovery depth", points: 25, fullMarks: "Uncovers real pain and who it affects, well beyond the surface" },
  { key: "signal", label: "Hidden-priority detection", points: 25, fullMarks: "Earns a partial or full reveal of the buried priority" },
  { key: "objection", label: "Objection handling", points: 25, fullMarks: "Acknowledges, reframes, backs it with evidence, moves forward" },
  { key: "value", label: "Value framing", points: 15, fullMarks: "Anchors on value/outcome, quantifies where possible" },
  { key: "listening", label: "Listening & adaptiveness", points: 10, fullMarks: "Picks up buyer signals and pivots rather than running a script" },
];

export const RUBRIC_MAX = RUBRIC.reduce((a, d) => a + d.points, 0);

export const PENALTIES = [
  "Generic questions ('what are your goals?', 'what keeps you up at night?'): -5 each",
  "Pitching before discovering: -10",
  "Deflecting or ignoring the signature objection: -10",
];

interface TitleBand {
  min: number;
  title: string;
}
// Highest band first. AXIOM may override with a behavior-specific title in its
// prompt; this is the deterministic fallback used if needed.
const TITLE_BANDS: TitleBand[] = [
  { min: 85, title: "Closer" },
  { min: 70, title: "Operator" },
  { min: 55, title: "Contender" },
  { min: 35, title: "Happy Ears" },
  { min: 0, title: "The Brochure" },
];

export function titleForScore(score: number): string {
  return TITLE_BANDS.find((b) => score >= b.min)!.title;
}

function clamp(n: number, lo: number, hi: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/** Extract the first balanced top-level JSON object from a model response. */
function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("no JSON object in verdict response");
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced JSON in verdict response");
}

export function parseVerdict(raw: string): Verdict {
  const obj = JSON.parse(extractJsonObject(raw)) as Partial<Verdict> & {
    dimensions?: Partial<VerdictDimensions>;
  };
  const d: Partial<VerdictDimensions> = obj.dimensions ?? {};
  const dimensions: VerdictDimensions = {
    discovery: clamp(d.discovery ?? 0, 0, 25),
    signal: clamp(d.signal ?? 0, 0, 25),
    objection: clamp(d.objection ?? 0, 0, 25),
    value: clamp(d.value ?? 0, 0, 15),
    listening: clamp(d.listening ?? 0, 0, 10),
  };
  const score = clamp(obj.score ?? 0, 0, 100);
  return {
    score,
    title: (obj.title && String(obj.title).trim()) || titleForScore(score),
    dimensions,
    bestLine: String(obj.bestLine ?? "").trim(),
    worstLine: String(obj.worstLine ?? "").trim(),
    roast: String(obj.roast ?? "").trim(),
    didDetectSignal: Boolean(obj.didDetectSignal),
    didHandleObjection: Boolean(obj.didHandleObjection),
  };
}
