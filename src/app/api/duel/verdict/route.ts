import { NextRequest, NextResponse } from "next/server";
import { anthropicClient, extractText } from "@/lib/anthropic";
import { VERDICT_MODEL, DUEL_PAUSED } from "@/lib/duel/config";
import { buildVerdictPrompt } from "@/lib/duel/verdictPrompt";
import { parseV2Verdict } from "@/lib/duel/scoring";
import { saveSession } from "@/lib/duel/store";
import { checkVerdictLimit, clientIp, verifyTurnstile } from "@/lib/duel/ratelimit";
import { DuelMessage, GeneratedScenario, Stage } from "@/lib/duel/types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  scenario: GeneratedScenario;
  history: DuelMessage[];
  stagesReached: Stage[];
  turnstileToken?: string;
}

export async function POST(req: NextRequest) {
  if (DUEL_PAUSED) return NextResponse.json({ error: "AXIOM is resting." }, { status: 503 });

  const ip = clientIp(req);
  const body = (await req.json()) as Body;
  const history = Array.isArray(body.history) ? body.history : [];
  if (!body.scenario || history.length === 0) {
    return NextResponse.json({ error: "scenario and non-empty history required" }, { status: 400 });
  }
  const stagesReached = Array.isArray(body.stagesReached) && body.stagesReached.length > 0
    ? body.stagesReached
    : ["discovery"] as Stage[];

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "verification failed" }, { status: 403 });
  }
  const rl = await checkVerdictLimit(ip);
  if (!rl.success) return NextResponse.json({ error: "slow down" }, { status: 429 });

  const transcript = history
    .map((m) => `${m.role === "player" ? "SALESPERSON" : body.scenario.buyerName}: ${m.content}`)
    .join("\n");

  try {
    const completion = await anthropicClient.messages.create({
      model: VERDICT_MODEL,
      max_tokens: 1200,
      system: buildVerdictPrompt(body.scenario, stagesReached),
      messages: [{ role: "user", content: `Score this transcript:\n\n${transcript}` }],
    });
    const verdict = parseV2Verdict(extractText(completion));
    const session = await saveSession({
      templateId: body.scenario.templateId,
      scenarioTitle: body.scenario.title,
      verdict,
    });
    return NextResponse.json({ session });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[duel/verdict] error", e);
    return NextResponse.json({ error: e?.message ?? "verdict failed" }, { status: 502 });
  }
}
