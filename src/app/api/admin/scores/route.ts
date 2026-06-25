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

  // Scan all player keys to get names and play counts
  const players: { name: string; plays: number; lastPlayed: number }[] = [];
  let cursor = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, { match: "duel:player:*", count: 100 });
    cursor = Number(nextCursor);
    for (const key of keys) {
      const data = await redis.hgetall<{ name?: string; plays?: string; lastPlayed?: string }>(key);
      if (data?.name) {
        players.push({
          name: data.name,
          plays: Number(data.plays ?? 1),
          lastPlayed: Number(data.lastPlayed ?? 0),
        });
      }
    }
  } while (cursor !== 0);

  // Sort by most recent
  players.sort((a, b) => b.lastPlayed - a.lastPlayed);

  // Get leaderboard scores (if any)
  const leaderboard: { name: string; score: number; title: string }[] = [];
  const lbEntries = await redis.zrange<string[]>("duel:leaderboard", 0, -1, { rev: true, withScores: true });
  if (lbEntries) {
    for (let i = 0; i < lbEntries.length; i += 2) {
      const name = String(lbEntries[i]);
      const score = Number(lbEntries[i + 1]);
      const meta = await redis.hgetall<{ title?: string }>(`duel:lb:${name.toLowerCase()}`);
      leaderboard.push({ name, score, title: meta?.title ?? "—" });
    }
  }

  return NextResponse.json({ totalPlayers, players, leaderboard, results });
}
