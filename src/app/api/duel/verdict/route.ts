import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { getScenario } from "@/lib/duel/scenarios";
import { buildAxiomVerdictPrompt } from "@/lib/duel/axiomPrompt";
import { parseVerdict } from "@/lib/duel/rubric";
import { saveSession, trackPlayer } from "@/lib/duel/store";
import { MAX_PLAYER_TURNS } from "@/lib/duel/config";
import { VERDICT_MODEL, DUEL_PAUSED } from "@/lib/duel/server-config";
import { checkVerdictLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  scenarioId: ScenarioId;
  history: DuelMessage[];
  playerName?: string;
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting. Check back soon." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;
  const history = Array.isArray(body.history) ? body.history : [];
  if (!body.scenarioId || history.length === 0) {
    return NextResponse.json({ error: "scenarioId and a non-empty history required" }, { status: 400 });
  }

  // Validate input sizes
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

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkVerdictLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down — too many requests" }, { status: 429 });

  let scenario;
  try {
    scenario = getScenario(body.scenarioId);
  } catch {
    return NextResponse.json({ error: "unknown scenario" }, { status: 404 });
  }

  const transcript = history
    .map((m) => `${m.role === "player" ? "SALESPERSON" : scenario.buyer.name}: ${m.content}`)
    .join("\n");

  try {
    const completion = await anthropicClient.messages.create({
      model: VERDICT_MODEL,
      max_tokens: 900,
      system: buildAxiomVerdictPrompt(scenario),
      messages: [{ role: "user", content: `Here is the full transcript. Score it.\n\n${transcript}` }],
    });
    const verdict = parseVerdict(extractText(completion));
    const session = await saveSession({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      verdict,
      playerName: body.playerName?.trim(),
    });
    if (body.playerName?.trim()) {
      await trackPlayer(body.playerName.trim());
    }
    return NextResponse.json({ session });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/verdict] error", e);
    // FIX 3: Suppress raw error messages
    return NextResponse.json({ error: "AXIOM could not render a verdict" }, { status: 502 });
  }
}
