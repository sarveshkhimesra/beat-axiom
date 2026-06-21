import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { VERDICT_MODEL, DUEL_PAUSED } from "@/lib/duel/config";
import { buildVerdictPrompt } from "@/lib/duel/verdictPrompt";
import { parseV2Verdict } from "@/lib/duel/scoring";
import { saveSession } from "@/lib/duel/store";
import { checkVerdictLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { getGame } from "@/lib/duel/gameStore";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  gameId: string;
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;

  if (!body.gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  // Load server-side game state (includes full scenario with secrets)
  const session = await getGame(body.gameId);
  if (!session) {
    return NextResponse.json({ error: "game session not found" }, { status: 404 });
  }

  const { scenario, history, stagesReached } = session;
  if (history.length === 0) {
    return NextResponse.json({ error: "no history in game session" }, { status: 400 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkVerdictLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down" }, { status: 429 });

  const transcript = history
    .map((m) => `${m.role === "player" ? "SALESPERSON" : scenario.buyerName}: ${m.content}`)
    .join("\n");

  try {
    const completion = await anthropicClient.messages.create({
      model: VERDICT_MODEL,
      max_tokens: 1200,
      system: buildVerdictPrompt(scenario, stagesReached),
      messages: [{ role: "user", content: `Score this transcript:\n\n${transcript}` }],
    });
    const verdict = parseV2Verdict(extractText(completion));
    const savedSession = await saveSession({
      templateId: scenario.templateId,
      scenarioTitle: scenario.title,
      verdict,
    });
    return NextResponse.json({ session: savedSession });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/verdict] error", e);
    return NextResponse.json({ error: e?.message ?? "verdict failed" }, { status: 502 });
  }
}
