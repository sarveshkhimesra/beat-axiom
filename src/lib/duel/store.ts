import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DuelSession, ScenarioId, Verdict } from "./types";
import { percentileFromRank } from "./percentile";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
  const zkey = scoresKey(args.scenarioId);

  // Add this score to the distribution, then compute rank.
  await redis.zadd(zkey, { score: args.verdict.score, member: shareId });
  const total = await redis.zcard(zkey);
  // zcount existing members strictly below this score = players we beat.
  const rankBelow = await redis.zcount(zkey, 0, args.verdict.score - 1);
  const percentile = percentileFromRank(rankBelow, total);

  const session: DuelSession = {
    shareId,
    scenarioId: args.scenarioId,
    scenarioTitle: args.scenarioTitle,
    verdict: args.verdict,
    percentile,
    createdAt: Date.now(),
  };
  // 90-day TTL on the shareable card.
  await redis.set(sessionKey(shareId), session, { ex: 60 * 60 * 24 * 90 });
  return session;
}

export async function getSession(shareId: string): Promise<DuelSession | null> {
  const raw = await redis.get<DuelSession>(sessionKey(shareId));
  return raw ?? null;
}
