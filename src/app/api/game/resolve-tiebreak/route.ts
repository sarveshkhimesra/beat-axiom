import { NextRequest, NextResponse } from "next/server";
import { mutateGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { StageNumber } from "@/lib/types";

export const runtime = "nodejs";

interface ResolveBody {
  teamId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ResolveBody;
    if (!body.teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });
    const state = await mutateGameState((s) => {
      const stage = s.stage as StageNumber;
      const evaluation = s.stageEvaluations[stage];
      if (!evaluation) throw new Error("no evaluation for current stage");
      if (!evaluation.tiebreakRequired) throw new Error("no tiebreak pending");
      const team = s.teams[body.teamId];
      if (!team) throw new Error(`unknown team ${body.teamId}`);
      evaluation.eliminatedTeamId = body.teamId;
      evaluation.tiebreakRequired = false;
      team.eliminated = true;
      team.eliminatedAtStage = stage;
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[resolve-tiebreak] error", err);
    return NextResponse.json(
      { error: e?.message ?? "tiebreak resolve failed" },
      { status: 500 },
    );
  }
}
