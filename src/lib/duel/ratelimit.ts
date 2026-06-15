import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// 30 buyer turns / 10 min / IP, and 6 verdicts / 10 min / IP. When Upstash is
// not configured (local dev), rate-limiting is skipped (always allowed).
const turnLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "10 m"), prefix: "duel:rl:turn" })
  : null;
const verdictLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(6, "10 m"), prefix: "duel:rl:verdict" })
  : null;

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkTurnLimit(ip: string): Promise<{ success: boolean }> {
  if (!turnLimiter) return { success: true };
  return turnLimiter.limit(ip);
}
export async function checkVerdictLimit(ip: string): Promise<{ success: boolean }> {
  if (!verdictLimiter) return { success: true };
  return verdictLimiter.limit(ip);
}

/** Verify a Cloudflare Turnstile token. Returns true when not configured (dev). */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → skip (local dev)
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
