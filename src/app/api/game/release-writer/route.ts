import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { COMPANIES } from "@/lib/content/companies";

export const runtime = "nodejs";

// Facilitator-only: free a team's write seat so a captain can re-claim it on a
// new device (e.g. their laptop died). No token needed — this is a trusted
// facilitator action.
interface ReleaseBody {
  teamId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ReleaseBody;
    if (!body.teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });
    const state = await mutateGameState((s) => {
      const team = s.teams[body.teamId];
      if (!team) throw new Error(`unknown team ${body.teamId}`);
      team.writerClientId = null;
      const co = team.company ? COMPANIES[team.company].name : team.playerName;
      pushConsole(s, `axiom lock --release team_${team.id}`, `${co} write lock cleared · captain can re-open on any device ✓`);
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[release-writer] error", err);
    return NextResponse.json({ error: e?.message ?? "release failed" }, { status: 500 });
  }
}
