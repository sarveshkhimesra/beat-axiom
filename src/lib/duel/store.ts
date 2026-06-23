import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DuelSession, ScenarioId, Verdict } from "./types";
import { percentileFromRank } from "./percentile";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback for local dev when Upstash isn't configured. Stashed on
// globalThis so it survives Next's per-route module instances within a single
// dev process. Not durable (resets on restart) — never used when Redis present.
const g = globalThis as unknown as {
  __duelMem?: { sessions: Map<string, DuelSession>; scores: Record<string, number[]> };
};
const mem = (g.__duelMem ??= { sessions: new Map<string, DuelSession>(), scores: {} });
const memSessions = mem.sessions;
const memScores = mem.scores;

const sessionKey = (id: string) => `duel:session:${id}`;
const scoresKey = (scenarioId: ScenarioId) => `duel:scores:${scenarioId}`;

/** Persist a completed duel: record score in the per-scenario distribution,
 * compute percentile, save the session. Returns the saved session. */
export async function saveSession(args: {
  scenarioId: ScenarioId;
  scenarioTitle: string;
  verdict: Verdict;
}): Promise<DuelSession> {
  const shareId = nanoid(10);
  const score = args.verdict.score;

  let total: number;
  let rankBelow: number;
  if (redis) {
    const zkey = scoresKey(args.scenarioId);
    await redis.zadd(zkey, { score, member: shareId });
    total = await redis.zcard(zkey);
    rankBelow = await redis.zcount(zkey, 0, score - 1);
  } else {
    const arr = (memScores[args.scenarioId] ??= []);
    arr.push(score);
    total = arr.length;
    rankBelow = arr.filter((s) => s < score).length;
  }
  const percentile = percentileFromRank(rankBelow, total);

  const session: DuelSession = {
    shareId,
    scenarioId: args.scenarioId,
    scenarioTitle: args.scenarioTitle,
    verdict: args.verdict,
    percentile,
    createdAt: Date.now(),
  };
  if (redis) {
    // 90-day TTL on the shareable card.
    await redis.set(sessionKey(shareId), session, { ex: 60 * 60 * 24 * 90 });
  } else {
    memSessions.set(shareId, session);
  }
  return session;
}

export async function getSession(shareId: string): Promise<DuelSession | null> {
  if (redis) {
    const raw = await redis.get<DuelSession>(sessionKey(shareId));
    return raw ?? null;
  }
  return memSessions.get(shareId) ?? null;
}

const PLAYER_COUNT_KEY = "duel:total_players";
const playerKey = (name: string) => `duel:player:${name.toLowerCase().trim()}`;

/** Track a player: increment global player count (if new), track their play count. */
export async function trackPlayer(playerName: string): Promise<{ playCount: number }> {
  const name = playerName.trim();
  if (!name) return { playCount: 1 };

  if (redis) {
    const key = playerKey(name);
    const exists = await redis.exists(key);
    if (!exists) {
      await redis.incr(PLAYER_COUNT_KEY);
    }
    const playCount = await redis.hincrby(key, "plays", 1);
    await redis.hset(key, { name, lastPlayed: Date.now() });
    return { playCount };
  }
  return { playCount: 1 };
}
