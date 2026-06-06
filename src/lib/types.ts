export type CompanyId =
  | "BLADESTACK"
  | "ORBISGLOBAL"
  | "VAULTBRIDGE"
  | "FLOWX"
  | "TERRATAP"
  | "NEXUSPAY";

export type CustomerId = "NOVABRAND";

export type GameStatus =
  | "lobby"
  | "axiom-demo"
  | "brief"
  | "stage-active"
  | "stage-evaluating"
  | "stage-reveal"
  | "ended";

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export interface ConversationMessage {
  role: "team" | "customer";
  content: string;
  at: number;
  stage: StageNumber;
  speakerId?: string;
  speakerName?: string;
  speakerRole?: string;
}

export interface TeamState {
  id: string;
  playerName: string;
  company: CompanyId | null;
  eliminated: boolean;
  eliminatedAtStage: StageNumber | null;
  // Why the facilitator eliminated them: "normal" (didn't make the cut) or
  // "ai" (flagged for AI-assisted play — announced on the projector as an
  // AXIOM integrity catch). null/undefined while still in.
  eliminatedReason?: "normal" | "ai" | null;
  // Secret per-team token that gates WRITE access. The captain's link carries
  // it (?k=<writeToken>); anyone without it (other team members, rival teams)
  // gets the read-only view. The write APIs verify it too. Undefined on games
  // created before this feature → write is open (backward compatible).
  writeToken?: string;
  // Separate token that gates the read-only WATCH link (?w=<watchToken>), so a
  // team can only watch its OWN conversation, not a rival's. Different from
  // writeToken. Undefined on pre-feature games → watch is open (legacy).
  watchToken?: string;
  // The single device currently holding write access (a random per-browser id).
  // First device to open the captain link claims it; other devices (even with
  // the token) are read-only until the facilitator resets the lock. null/unset
  // = unclaimed (next valid device claims it).
  writerClientId?: string | null;
  currentScore: number;
  temperatureGauge: number;
  secretPriorityProgress: number;
  conversationHistory: ConversationMessage[];
  stageRosters: Partial<Record<StageNumber, string[]>>;
  earnedStage2Access: boolean;
  stageSubmissions: Partial<Record<StageNumber, string>>;
  // Fact ids shown to THIS team as a planted falsehood (the 75/25 intel game).
  intelFlips: string[];
  // After Round 4, an AI recap of what this team learned across rounds 1-4,
  // to help them prepare the Round 5 pitch.
  preFinalBrief?: string;
}

// Within an active stage: ASK questions (chat) → SUBMIT a pitch.
export type StagePhase = "questions" | "pitch";

// A line in the projector's facilitator console — each facilitator action is
// mirrored here as a CLI-style command + output, streamed to the big screen.
export interface ConsoleLine {
  cmd: string;
  out: string;
  at: number;
}

export interface TeamStageScore {
  teamId: string;
  stage: StageNumber;
  dimensions: Record<string, number>;
  baseScore: number;
  penalties: number;
  responsivenessBonus: number;
  crossStageBonus: number;
  totalScore: number;
  bestQuestion: string | null;
  worstQuestion: string | null;
  quirkySummary: string; // 2-sentence analytical summary — shown on screen
  quirkyQuote: string; // one witty one-liner — the ONLY thing AXIOM says aloud
  secretPriorityProgress: number;
  secretPriorityRevealed: boolean;
  temperatureGauge: number;
  earnedStage2Access?: boolean;
  gateFailReason?: string;
}

export interface StageEvaluation {
  stage: StageNumber;
  scores: Record<string, TeamStageScore>;
  evaluatedAt: number;
  eliminatedTeamId: string | null;
  tiebreakRequired: boolean;
}

export interface GameFinale {
  winnerTeamId: string | null;
  winnerJourneyLine: string;
  idealPlay: {
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
    stage5: string;
  };
  growthOpportunities: Record<string, string>;
  finalizedAt: number;
}

export interface GameState {
  gameId: string;
  status: GameStatus;
  stage: StageNumber;
  stagePhase: StagePhase;
  customer: CustomerId | null;
  stageDurationSec: number;
  questionDurationSec: number;
  pitchDurationSec: number;
  briefDurationSec: number;
  stageStartedAt: number | null;
  // Facilitator-granted overtime for the CURRENT phase, in seconds. Added on
  // top of the phase duration; reset to 0 whenever a new phase/stage begins.
  extraTimeSec: number;
  pausedAt: number | null;
  pausedAccumulatedMs: number;
  teams: Record<string, TeamState>;
  teamOrder: string[];
  stageEvaluations: Partial<Record<StageNumber, StageEvaluation>>;
  finale?: GameFinale | null;
  demoStep?: number;
  // When true, teams can TYPE as well as speak (facilitator fallback if voice
  // misbehaves on the day). Default false = voice-only input.
  chatEnabled?: boolean;
  // When set, the projector plays a full-screen video (cinematic / demo).
  nowPlayingVideo?: "cinematic" | "demo" | null;
  // The most recent facilitator elimination — the projector watches the `at`
  // timestamp and plays a full-screen elimination announcement (buzzer + a
  // normal or AI-detected callout) once per new value, then reverts.
  elimAnnounce?: { teamId: string; reason: "normal" | "ai"; at: number } | null;
  console?: ConsoleLine[];
  createdAt: number;
  updatedAt: number;
}

export interface CompanyProfile {
  id: CompanyId;
  name: string;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
  floorPriceNote: string;
  whatRivalsSee: string;
  briefIdentity: string;
  briefEdge: string[];
  briefWeaknesses: string[];
  briefWhatWeKnowAboutCustomer: string;
  briefCostStructure: string;
  briefDealStrengths: string[];
}

export interface CustomerObjection {
  vsCompany: CompanyId;
  text: string;
}

export interface CustomerDecisionMaker {
  id: string;
  role: string;
  name: string;
  description: string;
  personality?: string;
  concerns?: string[];
  // Internal persona layer (AI-only, 100% true — never shown to teams).
  objective?: string; // what this persona is actually trying to achieve
  evaluationStyle?: string; // how it judges a vendor / what wins it over
  okrs?: string; // what they own / are measured on
  escalationTrigger?: string; // when they'd escalate to leadership
  tone?: string; // how they speak with vendors (warm, partner-like, etc.)
  gender?: "f" | "m" | "n";
}

export type StageRoster =
  | { kind: "fixed"; dmIds: string[] }
  | { kind: "pickN"; pool: string[]; pickCount: number };

export interface CustomerProfile {
  id: CustomerId;
  name: string;
  profile: string;
  knownPainPoints: string[];
  orgStructure: CustomerDecisionMaker[];
  meetingRosters: Record<StageNumber, StageRoster>;
  buyingProcess: string;
  budgetSignal: string;
  secretPriority: string;
  secretPriorityHintTopics: string[];
  stage3Objections: CustomerObjection[];
}

export const DEFAULT_STAGE_DURATION_SEC = 7 * 60;
export const DEFAULT_QUESTION_DURATION_SEC = 5 * 60;
export const DEFAULT_PITCH_DURATION_SEC = 5 * 60;
export const DEFAULT_BRIEF_DURATION_SEC = 5 * 60;
export const TEAM_IDS = ["1", "2", "3", "4", "5", "6"] as const;
export const PUSHER_CHANNEL = "the-deal";

export function computeTimeRemainingSec(state: GameState): number {
  if (state.status !== "stage-active" || !state.stageStartedAt) return 0;
  const now = state.pausedAt ?? Date.now();
  const elapsedMs = now - state.stageStartedAt - state.pausedAccumulatedMs;
  // Each phase has its own clock; the timer resets when the phase flips.
  const phaseDuration =
    (state.stagePhase === "pitch" ? state.pitchDurationSec : state.questionDurationSec) +
    (state.extraTimeSec ?? 0);
  const remaining = phaseDuration - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
}
