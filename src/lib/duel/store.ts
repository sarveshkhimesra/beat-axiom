import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DuelSession, TemplateId, V2Verdict } from "./types";
import { percentileFromRank } from "./percentile";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

const g = globalThis as unknown as {
  __duelMem?: { sessions: Map<string, DuelSession>; scores: Record<string, number[]> };
};
const mem = (g.__duelMem ??= { sessions: new Map<string, DuelSession>(), scores: {} });
const memSessions = mem.sessions;
const memScores = mem.scores;

const sessionKey = (id: string) => `duel:session:${id}`;
const scoresKey = (templateId: TemplateId) => `duel:scores:${templateId}`;

export async function saveSession(args: {
  templateId: TemplateId;
  scenarioTitle: string;
  verdict: V2Verdict;
}): Promise<DuelSession> {
  const shareId = nanoid(10);
  const score = args.verdict.score;

  let total: number;
  let rankBelow: number;
  if (redis) {
    const zkey = scoresKey(args.templateId);
    await redis.zadd(zkey, { score, member: shareId });
    total = await redis.zcard(zkey);
    rankBelow = await redis.zcount(zkey, 0, score - 1);
  } else {
    const arr = (memScores[args.templateId] ??= []);
    arr.push(score);
    total = arr.length;
    rankBelow = arr.filter((s) => s < score).length;
  }
  const percentile = percentileFromRank(rankBelow, total);

  const session: DuelSession = {
    shareId,
    templateId: args.templateId,
    scenarioTitle: args.scenarioTitle,
    verdict: args.verdict,
    percentile,
    createdAt: Date.now(),
  };
  if (redis) {
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
