import { NextResponse } from "next/server";
import { mutateGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

// Flip the active stage from the questions phase into the pitch phase.
// Resets the clock so the pitch phase gets its own full timer.
export async function POST() {
  try {
    const state = await mutateGameState((s) => {
      if (s.status !== "stage-active") {
        throw new Error(`can only open pitch during an active stage (status: ${s.status})`);
      }
      s.stagePhase = "pitch";
      s.stageStartedAt = Date.now();
      s.extraTimeSec = 0; // fresh clock for the pitch phase
      s.pausedAt = null;
      s.pausedAccumulatedMs = 0;
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/open-pitch] error", err);
    return NextResponse.json({ error: e?.message ?? "open-pitch failed" }, { status: 500 });
  }
}
