export type ScenarioId = "skeptical-vp" | "cutting-cfo" | "committee-gatekeeper";

/** The buyer the player talks to (a single persona, AI-roleplayed). */
export interface Buyer {
  name: string;
  role: string;
  /** Public personality the player can infer. */
  personality: string;
  /** Surface pains the buyer will share when asked reasonably. */
  surfacePains: string[];
  /** The buried priority — guarded; only revealed when earned. */
  hiddenPriority: string;
  /** Topics that, when probed sharply & repeatedly, unlock the hidden priority. */
  hiddenPriorityHintTopics: string[];
  /** The signature objection, landed partway through the duel. */
  signatureObjection: string;
  /** Budget/urgency signal (never volunteer exact numbers). */
  budgetSignal: string;
}

export interface Scenario {
  id: ScenarioId;
  /** Short title shown to the player + on the scorecard. */
  title: string;
  /** What the player is selling. */
  product: string;
  /** One strength the player should lean on. */
  sellerStrength: string;
  /** One weakness the player should own. */
  sellerWeakness: string;
  /** One-line setup shown before the duel starts. */
  setup: string;
  buyer: Buyer;
}

export interface DuelMessage {
  role: "player" | "buyer";
  content: string;
  at: number;
}

export interface VerdictDimensions {
  discovery: number;
  signal: number;
  objection: number;
  value: number;
  listening: number;
}

export interface Verdict {
  score: number; // 0–100
  title: string;
  dimensions: VerdictDimensions;
  bestLine: string;
  worstLine: string;
  roast: string;
  didDetectSignal: boolean;
  didHandleObjection: boolean;
}

/** A completed, persisted duel — the shareable artifact's data. */
export interface DuelSession {
  shareId: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  verdict: Verdict;
  percentile: number; // 0–100, computed at persist time
  createdAt: number;
}
