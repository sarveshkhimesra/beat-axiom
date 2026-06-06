import { NextResponse } from "next/server";
import { getGameState } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getGameState();
    return NextResponse.json({ state });
  } catch (err) {
    console.error("[game/state] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "state fetch failed", state: null },
      { status: 500 },
    );
  }
}
