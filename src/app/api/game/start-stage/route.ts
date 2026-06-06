import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { StageNumber } from "@/lib/types";
import { STAGE_RUBRICS } from "@/lib/scoring";
import { ensureRostersForStage } from "@/lib/roster";

export const runtime = "nodejs";

interface StartBody {
  stage?: StageNumber;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as StartBody;
    const state = await mutateGameState((s) => {
      if (body.stage) s.stage = body.stage;
      s.status = "stage-active";
      // Rounds 1-4 are pure conversation (questions). Round 5 is the only pitch round.
      s.stagePhase = s.stage === 5 ? "pitch" : "questions";
      s.stageStartedAt = Date.now();
      s.extraTimeSec = 0; // fresh clock for the new phase
      s.pausedAt = null;
      s.pausedAccumulatedMs = 0;
      ensureRostersForStage(s, s.stage as StageNumber);
      const title = STAGE_RUBRICS[s.stage as StageNumber]?.title ?? "";
      const mins = Math.floor((s.stage === 5 ? s.pitchDurationSec : s.questionDurationSec) / 60);
      const phase = s.stage === 5 ? "pitch" : "questions";
      pushConsole(
        s,
        `curl -sXPOST $DEAL/api/round/${s.stage}/start`,
        `200 OK · round=${s.stage} "${title}" · phase=${phase} · clock=0${mins}:00 ▸ LIVE`,
      );
      return s;
    });
    await broadcast("game:stage-start", { stage: state.stage });
    return NextResponse.json({ state });
  } catch (err) {
    console.error("[game/start-stage] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "start-stage failed" },
      { status: 500 },
    );
  }
}
