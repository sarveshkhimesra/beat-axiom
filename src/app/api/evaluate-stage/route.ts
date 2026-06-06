import { NextRequest, NextResponse } from "next/server";
import { getGameState } from "@/lib/redis";
import { evaluateStage } from "@/lib/axiom";
import { StageNumber } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // DRY-RUN ONLY — this endpoint scores teams but does NOT persist results to Redis,
  // does NOT update team scores, and does NOT advance game state.
  // Use /api/game/end-stage to score and advance the game.
  // This exists for debugging AXIOM prompts only.
  try {
    const body = (await req.json().catch(() => ({}))) as { stage?: StageNumber };
    const state = await getGameState();
    if (!state) {
      return NextResponse.json({ error: "no active game" }, { status: 400 });
    }
    const stage = (body.stage ?? state.stage) as StageNumber;
    const evaluation = await evaluateStage(state, stage);
    return NextResponse.json({ dryRun: true, evaluation }, { headers: { "X-Dry-Run": "true" } });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[evaluate-stage] error", err);
    return NextResponse.json(
      { error: e?.message ?? "evaluate-stage failed" },
      { status: typeof e?.status === "number" ? e.status : 500 },
    );
  }
}
