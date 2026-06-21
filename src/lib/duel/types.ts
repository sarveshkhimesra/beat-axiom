// src/lib/duel/types.ts — v2 domain types

export type Stage = "discovery" | "pitch" | "negotiate" | "close";
export const STAGES: Stage[] = ["discovery", "pitch", "negotiate", "close"];

export type TemplateId =
  | "skeptical-vp"
  | "cost-cutting-cfo"
  | "committee-gatekeeper"
  | "technical-blocker"
  | "champion-no-power"
  | "incumbent-defender"
  | "speed-buyer"
  | "multi-stakeholder";

export interface ScenarioTemplate {
  id: TemplateId;
  archetype: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  buyerRole: string;
  personality: string;
  hiddenPriority: string;
  hiddenPriorityHintTopics: string[];
  signatureObjection: string;
  stageUnlockCriteria: Record<Stage, string>;
  impatienceConfig: { baseRate: number; genericQuestionPenalty: number };
  variationPrompt: string;
}

export interface GeneratedScenario {
  templateId: TemplateId;
  title: string;
  companyName: string;
  backstory: string;
  buyerName: string;
  buyerRole: string;
  personality: string;
  product: string;
  sellerStrength: string;
  sellerWeakness: string;
  surfacePains: string[];
  hiddenPriority: string;
  hiddenPriorityHintTopics: string[];
  signatureObjection: string;
  budgetSignal: string;
  stageUnlockCriteria: Record<Stage, string>;
  impatienceConfig: { baseRate: number; genericQuestionPenalty: number };
  brief: string;
}

/** The subset of scenario data safe to send to the client (no game secrets). */
export interface ClientScenario {
  gameId: string;
  templateId: TemplateId;
  title: string;
  companyName: string;
  buyerName: string;
  buyerRole: string;
  product: string;
  sellerStrength: string;
  sellerWeakness: string;
  brief: string;
}

export interface DuelMessage {
  role: "player" | "buyer";
  content: string;
  at: number;
}

export interface TurnMetadata {
  currentStage: Stage;
  stageJustUnlocked: Stage | null;
  impatienceLevel: number;
  gameOver: boolean;
  gameOverReason: "closed" | "walkaway" | "soft-max" | null;
  hookLine: string;
}

export interface StageScores {
  discovery: Record<string, number>;
  pitch: Record<string, number>;
  negotiate: Record<string, number>;
  close: Record<string, number>;
}

export interface V2Verdict {
  score: number;
  title: string;
  stageScores: StageScores;
  modifiers: {
    efficiency: number;
    hiddenPriority: number;
    walkaway: boolean;
    genericPenalty: number;
    prematurePitch: number;
  };
  bestLine: string;
  worstLine: string;
  roast: string;
  stagesSummary: string;
  didDetectSignal: boolean;
  buyerWalkedAway: boolean;
}

export interface DuelSession {
  shareId: string;
  templateId: TemplateId;
  scenarioTitle: string;
  verdict: V2Verdict;
  percentile: number;
  createdAt: number;
}

export interface PlayerProfile {
  username: string;
  games: Array<{
    templateId: TemplateId;
    score: number;
    title: string;
    date: number;
    shareId: string;
  }>;
}
