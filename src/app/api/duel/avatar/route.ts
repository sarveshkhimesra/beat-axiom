import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { getScenario } from "@/lib/duel/scenarios";
import { buildBuyerPrompt } from "@/lib/duel/avatarPrompt";
import { MAX_PLAYER_TURNS } from "@/lib/duel/config";
import { AVATAR_MODEL, DUEL_PAUSED } from "@/lib/duel/server-config";
import { checkTurnLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  scenarioId: ScenarioId;
  message: string;
  history: DuelMessage[];
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting. Check back soon." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;

  if (!body.scenarioId || typeof body.message !== "string") {
    return NextResponse.json({ error: "scenarioId and message required" }, { status: 400 });
  }
  const message = body.message.trim();
  if (!message) return NextResponse.json({ error: "message is empty" }, { status: 400 });

  // Validate input sizes
  if (message.length > 1000) {
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history : [];

  if (history.length > MAX_PLAYER_TURNS * 2) {
    return NextResponse.json({ error: "history too long" }, { status: 400 });
  }
  for (const m of history) {
    if (!m || typeof m.content !== "string" || !["player", "buyer"].includes(m.role)) {
      return NextResponse.json({ error: "invalid history format" }, { status: 400 });
    }
    if (m.content.length > 2000) {
      return NextResponse.json({ error: "history message too long" }, { status: 400 });
    }
  }

  const askedSoFar = history.filter((m) => m.role === "player").length;
  if (askedSoFar >= MAX_PLAYER_TURNS) {
    return NextResponse.json({ error: "turn limit reached — get your verdict" }, { status: 409 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkTurnLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down — too many requests" }, { status: 429 });

  let scenario;
  try {
    scenario = getScenario(body.scenarioId);
  } catch {
    return NextResponse.json({ error: "unknown scenario" }, { status: 404 });
  }

  const system = buildBuyerPrompt(scenario, askedSoFar + 1);
  const messages = history.map((m) => ({
    role: (m.role === "player" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  try {
    const completion = await anthropicClient.messages.create({
      model: AVATAR_MODEL,
      max_tokens: 400,
      system,
      messages,
    });
    const reply = extractText(completion);

    // FIX 4: Global vague regex — handles tag anywhere in response, uses last match
    const vagueMatcher = /\[VAGUE:(true|false)\]/g;
    const vagueMatches = reply.match(vagueMatcher);
    const vague = vagueMatches ? vagueMatches[vagueMatches.length - 1].includes("true") : false;
    const cleanReply = reply.replace(vagueMatcher, "").trim();

    const now = Date.now();
    return NextResponse.json({
      playerMessage: { role: "player", content: message, at: now } as DuelMessage,
      buyerMessage: { role: "buyer", content: cleanReply, at: now + 1 } as DuelMessage,
      turnsUsed: askedSoFar + 1,
      turnsLeft: MAX_PLAYER_TURNS - (askedSoFar + 1),
      vague,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/avatar] upstream error", e);
    // FIX 3: Suppress raw error messages
    return NextResponse.json({ error: "AXIOM's buyer is unavailable" }, { status: 502 });
  }
}
