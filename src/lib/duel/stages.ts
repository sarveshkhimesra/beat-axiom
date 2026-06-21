import { Stage } from "./types";

export interface StageDefinition {
  id: Stage;
  label: string;
  buyerMode: string;
  unlockDescription: string;
}

export const STAGE_DEFINITIONS: Record<Stage, StageDefinition> = {
  discovery: {
    id: "discovery",
    label: "Discovery",
    buyerMode: "Warm, open, shares surface pains. Guards hidden priority.",
    unlockDescription: "Player uncovers ≥2 specific pains AND asks about impact or stakeholders.",
  },
  pitch: {
    id: "pitch",
    label: "Pitch",
    buyerMode: "Evaluative, probes weaknesses, compares to alternatives.",
    unlockDescription: "Player articulates value proposition tied to discovered pains.",
  },
  negotiate: {
    id: "negotiate",
    label: "Negotiate",
    buyerMode: "Harder, pushes back on price/terms, raises objections.",
    unlockDescription: "Player addresses the main objection AND proposes a deal structure.",
  },
  close: {
    id: "close",
    label: "Close",
    buyerMode: "Decision-mode. Wants commitment, timeline, next steps.",
    unlockDescription: "Player asks for commitment or proposes a clear next step.",
  },
};

export function nextStage(current: Stage): Stage | null {
  const idx = ["discovery", "pitch", "negotiate", "close"].indexOf(current);
  if (idx < 3) return ["discovery", "pitch", "negotiate", "close"][idx + 1] as Stage;
  return null;
}

export const IMPATIENCE_THRESHOLDS = {
  hinting: 0.3,
  curt: 0.5,
  wrapping: 0.7,
  walkaway: 1.0,
} as const;
