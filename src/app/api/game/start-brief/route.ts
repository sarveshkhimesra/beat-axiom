import { NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

// Pre-Stage-1 reading period. Teams see their company brief with the clock NOT
// running, so everyone reads before the Stage 1 timer starts together. F-12.
export async function POST() {
  try {
    const state = await mutateGameState((s) => {
      if (!s.customer) throw new Error("pick a customer before showing the brief");
      // Guard: the brief is a pre-game phase. Don't let a mis-click drop a live
      // or evaluating stage back into standby and wipe the running timer.
      if (
        s.status === "stage-active" ||
        s.status === "stage-evaluating" ||
        s.status === "stage-reveal" ||
        s.status === "ended"
      ) {
        throw new Error(`cannot show brief while game is ${s.status}`);
      }
      s.status = "brief";
      pushConsole(s, "curl -sXPOST $DEAL/api/brief/show", "202 · briefs broadcast to all teams · clock=PAUSED");
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/start-brief] error", err);
    return NextResponse.json({ error: e?.message ?? "start-brief failed" }, { status: 500 });
  }
}
