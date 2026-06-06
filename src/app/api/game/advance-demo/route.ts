import { NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { buildDemoScript } from "@/lib/demoScript";
import { CustomerId } from "@/lib/types";

export const runtime = "nodejs";

export async function POST() {
  try {
    const state = await mutateGameState((s) => {
      if (s.status !== "axiom-demo") throw new Error("not in demo mode");
      if (!s.customer) throw new Error("no customer selected");
      const script = buildDemoScript(s.customer as CustomerId);
      const next = (s.demoStep ?? 0) + 1;
      if (next >= script.length) {
        // End of demo — return to lobby so facilitator can hit "Start Round 1".
        s.status = "lobby";
        s.demoStep = 0;
        pushConsole(s, "./deal demo --next", "EOF · intro complete · status=LOBBY");
      } else {
        s.demoStep = next;
        pushConsole(s, "./deal demo --next", `frame ${next + 1}/${script.length} ▸`);
      }
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/advance-demo] error", err);
    return NextResponse.json({ error: e?.message ?? "advance-demo failed" }, { status: 500 });
  }
}
