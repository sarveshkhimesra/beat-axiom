import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

interface Body {
  video?: "cinematic" | "demo" | null;
}

// Facilitator plays / stops a full-screen video on the projector.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const video = body.video === "cinematic" || body.video === "demo" ? body.video : null;
    const state = await mutateGameState((s) => {
      s.nowPlayingVideo = video;
      pushConsole(
        s,
        video ? `./deal play --video ${video}` : "./deal video --stop",
        video ? `▸ projecting ${video} reel` : "video stopped · back to game",
      );
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "video toggle failed" }, { status: 400 });
  }
}
