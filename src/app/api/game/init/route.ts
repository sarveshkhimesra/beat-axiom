import { NextRequest, NextResponse } from "next/server";
import { buildFreshGameState, setGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { CompanyId, CustomerId } from "@/lib/types";

export const runtime = "nodejs";

interface InitBody {
  customer: CustomerId;
  stageDurationSec?: number;
  briefDurationSec?: number;
  teamAssignments: Array<{
    teamId: string;
    playerName: string;
    company: CompanyId | null;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InitBody;
    if (!body.customer) {
      return NextResponse.json({ error: "customer is required" }, { status: 400 });
    }
    const state = buildFreshGameState({
      customer: body.customer,
      stageDurationSec: body.stageDurationSec,
      briefDurationSec: body.briefDurationSec,
      teamAssignments: body.teamAssignments ?? [],
    });
    await setGameState(state);
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    console.error("[game/init] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "init failed" },
      { status: 500 },
    );
  }
}
