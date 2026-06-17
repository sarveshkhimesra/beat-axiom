import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { getScenario } from "@/lib/duel/scenarios";
import { buildBuyerPrompt } from "@/lib/duel/avatarPrompt";
import { AVATAR_MODEL, MAX_PLAYER_TURNS, DUEL_PAUSED } from "@/lib/duel/config";
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

  const history = Array.isArray(body.history) ? body.history : [];
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
    const now = Date.now();
    return NextResponse.json({
      playerMessage: { role: "player", content: message, at: now } as DuelMessage,
      buyerMessage: { role: "buyer", content: reply, at: now + 1 } as DuelMessage,
      turnsUsed: askedSoFar + 1,
      turnsLeft: MAX_PLAYER_TURNS - (askedSoFar + 1),
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/avatar] upstream error", e);
    return NextResponse.json({ error: e?.message ?? "AXIOM's buyer is unavailable" }, { status: 502 });
  }
}
