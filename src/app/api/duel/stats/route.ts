import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const redis = hasRedis
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

const SEED_COUNT = 37;
const PLAYER_COUNT_KEY = "duel:total_players";

export async function GET() {
  let totalPlayers = SEED_COUNT;
  if (redis) {
    const count = await redis.get<number>(PLAYER_COUNT_KEY);
    totalPlayers = (count ?? 0) + SEED_COUNT;
  }
  return NextResponse.json({ totalPlayers });
}
