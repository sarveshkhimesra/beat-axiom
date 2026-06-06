import { NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

export async function POST() {
  try {
    const state = await mutateGameState((s) => {
      if (s.status !== "axiom-demo") throw new Error("not in demo mode");
      s.status = "lobby";
      s.demoStep = 0;
      pushConsole(s, "./deal demo --stop", "demo halted · status=LOBBY");
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/end-demo] error", err);
    return NextResponse.json({ error: e?.message ?? "end-demo failed" }, { status: 500 });
  }
}
