import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole, computeTimeRemainingSec } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

interface ExtendBody {
  seconds?: number;
}

// Facilitator grants overtime to the CURRENT phase (default +2:00). The clock
// keeps running; nothing locks until the facilitator ends the round.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ExtendBody;
    const add = Math.max(15, Math.min(600, body.seconds ?? 120));
    const state = await mutateGameState((s) => {
      if (s.status !== "stage-active") {
        throw new Error(`can only extend time during an active round (status: ${s.status})`);
      }
      s.extraTimeSec = (s.extraTimeSec ?? 0) + add;
      const remain = computeTimeRemainingSec(s);
      const mm = String(Math.floor(remain / 60)).padStart(2, "0");
      const ss = String(remain % 60).padStart(2, "0");
      pushConsole(
        s,
        `curl -sXPOST $DEAL/api/round/${s.stage}/extend -d secs=${add}`,
        `200 · +${Math.round(add / 60)}:00 granted · clock=${mm}:${ss} ▸ still LIVE`,
      );
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/extend-time] error", err);
    return NextResponse.json({ error: e?.message ?? "extend-time failed" }, { status: 400 });
  }
}
