import { NextResponse } from "next/server";
import { getGameState, mutateGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { finalizeGame } from "@/lib/axiom";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const state = await getGameState();
    if (!state) return NextResponse.json({ error: "no active game" }, { status: 400 });
    const finale = await finalizeGame(state);
    const updated = await mutateGameState((s) => {
      s.status = "ended";
      s.finale = finale;
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ finale, state: updated });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[finalize] error", err);
    return NextResponse.json(
      { error: e?.message ?? "finalize failed" },
      { status: 500 },
    );
  }
}
