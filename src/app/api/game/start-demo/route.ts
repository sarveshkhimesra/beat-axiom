import { NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

export async function POST() {
  try {
    const state = await mutateGameState((s) => {
      if (!s.customer) throw new Error("pick a customer before starting the demo");
      s.status = "axiom-demo";
      s.demoStep = 0;
      pushConsole(s, "./deal demo --play intro", "▸ streaming AXIOM intro …");
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/start-demo] error", err);
    return NextResponse.json({ error: e?.message ?? "start-demo failed" }, { status: 500 });
  }
}
