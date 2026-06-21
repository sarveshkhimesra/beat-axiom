import { NextRequest, NextResponse } from "next/server";
import { chatCompletionWithHistory } from "@/lib/openai";
import { SOFT_MAX_TURNS, DUEL_PAUSED } from "@/lib/duel/config";
import { buildBuyerPrompt } from "@/lib/duel/buyerPrompt";
import { parseResponse } from "@/lib/duel/parseMeta";
import { checkTurnLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, Stage } from "@/lib/duel/types";
import { getGame, updateGame } from "@/lib/duel/gameStore";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  gameId: string;
  message: string;
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;

  if (!body.gameId || typeof body.message !== "string") {
    return NextResponse.json({ error: "gameId and message required" }, { status: 400 });
  }
  const message = body.message.trim();
  if (!message) return NextResponse.json({ error: "message is empty" }, { status: 400 });

  // Load server-side game state (includes full scenario with secrets)
  const session = await getGame(body.gameId);
  if (!session) {
    return NextResponse.json({ error: "game session not found" }, { status: 404 });
  }

  const { scenario, history, currentStage, impatienceLevel } = session;
  const turnCount = history.filter((m) => m.role === "player").length;

  // Soft max enforcement
  if (turnCount >= SOFT_MAX_TURNS) {
    return NextResponse.json({
      buyerMessage: { role: "buyer", content: "I appreciate your time, but I need to wrap up. Let's reconnect if there's a fit.", at: Date.now() },
      currentStage,
      stageJustUnlocked: null,
      impatienceLevel: 1.0,
      gameOver: true,
      gameOverReason: "soft-max",
      hookLine: "meeting time exhausted.",
    });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkTurnLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down" }, { status: 429 });

  const system = buildBuyerPrompt(scenario, currentStage, impatienceLevel, turnCount + 1);
  const messages = history.map((m) => ({
    role: (m.role === "player" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
  messages.push({ role: "user", content: message });

  try {
    const raw = await chatCompletionWithHistory({ system, messages, maxTokens: 600 });
    const { message: buyerText, meta } = parseResponse(raw);
    const now = Date.now();

    const playerMessage: DuelMessage = { role: "player", content: message, at: now };
    const buyerMessage: DuelMessage = { role: "buyer", content: buyerText, at: now + 1 };

    // Compute updated state
    const newStage = (meta.currentStage as Stage) ?? currentStage;
    const newImpatience = typeof meta.impatienceLevel === "number" ? meta.impatienceLevel : impatienceLevel;
    const newStagesReached = meta.stageJustUnlocked && !session.stagesReached.includes(meta.stageJustUnlocked as Stage)
      ? [...session.stagesReached, meta.stageJustUnlocked as Stage]
      : session.stagesReached;

    // Persist updated state server-side
    await updateGame(body.gameId, {
      history: [...history, playerMessage, buyerMessage],
      currentStage: newStage,
      stagesReached: newStagesReached,
      impatienceLevel: newImpatience,
    });

    return NextResponse.json({
      playerMessage,
      buyerMessage,
      ...meta,
    });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/turn] upstream error", e);
    return NextResponse.json({ error: e?.message ?? "buyer unavailable" }, { status: 502 });
  }
}
