import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "beat-axiom-admin-2026";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) return NextResponse.json({ error: "no redis" }, { status: 500 });

  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  const scenarios = ["skeptical-vp", "cutting-cfo", "committee-gatekeeper", "enthusiastic-champion", "silent-evaluator"];

  const results: Record<string, { shareId: string; score: number }[]> = {};

  for (const s of scenarios) {
    const entries = await redis.zrange<string[]>(`duel:scores:${s}`, 0, -1, { rev: true, withScores: true });
    const parsed: { shareId: string; score: number }[] = [];
    if (entries) {
      for (let i = 0; i < entries.length; i += 2) {
        parsed.push({ shareId: String(entries[i]), score: Number(entries[i + 1]) });
      }
    }
    results[s] = parsed;
  }

  const totalPlayers = await redis.get<number>("duel:total_players") ?? 0;

  return NextResponse.json({ totalPlayers, results });
}
