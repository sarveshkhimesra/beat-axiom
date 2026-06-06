import { Redis } from "@upstash/redis";
import {
  DEFAULT_BRIEF_DURATION_SEC,
  DEFAULT_STAGE_DURATION_SEC,
  DEFAULT_QUESTION_DURATION_SEC,
  DEFAULT_PITCH_DURATION_SEC,
  GameState,
  TEAM_IDS,
  TeamState,
} from "./types";
export { computeTimeRemainingSec } from "./types";
import { computeIntelFlips } from "./content/intel";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SINGLE_GAME_KEY = "thedeal:game:current";

export async function getGameState(): Promise<GameState | null> {
  const raw = await redis.get<GameState>(SINGLE_GAME_KEY);
  return raw ?? null;
}

export async function setGameState(state: GameState): Promise<void> {
  state.updatedAt = Date.now();
  await redis.set(SINGLE_GAME_KEY, state);
}

// Append a CLI-style line to the projector console feed (capped to last 40).
export function pushConsole(s: GameState, cmd: string, out: string): void {
  if (!s.console) s.console = [];
  s.console.push({ cmd, out, at: Date.now() });
  if (s.console.length > 40) s.console = s.console.slice(-40);
}

export async function mutateGameState(
  fn: (state: GameState) => GameState | Promise<GameState>,
): Promise<GameState> {
  const current = await getGameState();
  if (!current) throw new Error("No active game state. Initialize first.");
  const next = await fn(current);
  await setGameState(next);
  return next;
}

// Deterministic, unguessable per-team tokens. Keyed on the COMPANY (the URL
// slug) so the same team always gets the SAME tokens across re-inits — links
// you've handed out keep working even if the game is reset. Bump a salt to
// invalidate every previously-shared link of that kind at once.
const WRITE_TOKEN_SALT = "thedeal-novabrand-2026-v1-9f3ax";
const WATCH_TOKEN_SALT = "thedeal-novabrand-2026-watch-7q2kz";
function stableToken(salt: string, key: string): string {
  const base = `${salt}:${key}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < base.length; i++) {
    const c = base.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(36) + h2.toString(36)).slice(0, 10);
}

export function buildFreshGameState(opts: {
  customer: GameState["customer"];
  stageDurationSec?: number;
  questionDurationSec?: number;
  pitchDurationSec?: number;
  briefDurationSec?: number;
  teamAssignments: Array<{
    teamId: string;
    playerName: string;
    company: TeamState["company"];
  }>;
}): GameState {
  const now = Date.now();
  const teams: Record<string, TeamState> = {};
  const teamOrder: string[] = [];
  TEAM_IDS.forEach((id, teamIndex) => {
    const assignment = opts.teamAssignments.find((a) => a.teamId === id);
    const company = assignment?.company ?? null;
    teams[id] = {
      id,
      playerName: assignment?.playerName ?? `Team ${id}`,
      company,
      eliminated: false,
      eliminatedAtStage: null,
      eliminatedReason: null,
      // Stable, unguessable tokens for this team's captain + watch links
      // (same across re-inits — see stableToken).
      writeToken: stableToken(WRITE_TOKEN_SALT, company ?? id),
      watchToken: stableToken(WATCH_TOKEN_SALT, company ?? id),
      // Unclaimed on a fresh game → the first captain device that opens the link
      // claims the single write seat.
      writerClientId: null,
      currentScore: 0,
      temperatureGauge: 0.5,
      secretPriorityProgress: 0,
      conversationHistory: [],
      stageRosters: {},
      earnedStage2Access: false,
      stageSubmissions: {},
      intelFlips: computeIntelFlips(teamIndex, company),
    };
    teamOrder.push(id);
  });
  return {
    gameId: `thedeal-${now}`,
    status: "lobby",
    stage: 1,
    stagePhase: "questions",
    customer: opts.customer,
    stageDurationSec: opts.stageDurationSec ?? DEFAULT_STAGE_DURATION_SEC,
    questionDurationSec: opts.questionDurationSec ?? DEFAULT_QUESTION_DURATION_SEC,
    pitchDurationSec: opts.pitchDurationSec ?? DEFAULT_PITCH_DURATION_SEC,
    briefDurationSec: opts.briefDurationSec ?? DEFAULT_BRIEF_DURATION_SEC,
    stageStartedAt: null,
    extraTimeSec: 0,
    pausedAt: null,
    pausedAccumulatedMs: 0,
    teams,
    teamOrder,
    stageEvaluations: {},
    finale: null,
    chatEnabled: false,
    nowPlayingVideo: null,
    elimAnnounce: null,
    console: [
      { cmd: "curl -sXPOST $DEAL/api/game/init", out: "200 · state wiped · 6 teams seeded · customer=NovaBrand · status=LOBBY ✓", at: now },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

