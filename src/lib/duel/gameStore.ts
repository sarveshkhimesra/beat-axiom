// src/lib/duel/gameStore.ts — server-side game session store
import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { GeneratedScenario, DuelMessage, Stage } from "./types";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedis
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

const g = globalThis as unknown as { __gameStore?: Map<string, GameSession> };
const memStore = (g.__gameStore ??= new Map<string, GameSession>());

export interface GameSession {
  gameId: string;
  scenario: GeneratedScenario;
  history: DuelMessage[];
  currentStage: Stage;
  stagesReached: Stage[];
  impatienceLevel: number;
  createdAt: number;
}

const gameKey = (id: string) => `duel:game:${id}`;

export async function createGame(scenario: GeneratedScenario): Promise<string> {
  const gameId = nanoid(12);
  const session: GameSession = {
    gameId,
    scenario,
    history: [],
    currentStage: "discovery",
    stagesReached: ["discovery"],
    impatienceLevel: 0,
    createdAt: Date.now(),
  };
  if (redis) {
    await redis.set(gameKey(gameId), session, { ex: 60 * 60 * 4 }); // 4h TTL
  } else {
    memStore.set(gameId, session);
  }
  return gameId;
}

export async function getGame(gameId: string): Promise<GameSession | null> {
  if (redis) {
    return (await redis.get<GameSession>(gameKey(gameId))) ?? null;
  }
  return memStore.get(gameId) ?? null;
}

export async function updateGame(
  gameId: string,
  updates: Partial<Pick<GameSession, "history" | "currentStage" | "stagesReached" | "impatienceLevel">>
): Promise<void> {
  const session = await getGame(gameId);
  if (!session) return;
  const updated = { ...session, ...updates };
  if (redis) {
    await redis.set(gameKey(gameId), updated, { ex: 60 * 60 * 4 });
  } else {
    memStore.set(gameId, updated);
  }
}
