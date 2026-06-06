import { NextRequest, NextResponse } from "next/server";
import { mutateGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

// A captain device claims the single write seat for its team. First valid device
// wins; the same device re-claiming is idempotent (so refresh/reopen keeps it).
// Another device with the right token but a different clientId is refused — it
// stays read-only until the facilitator resets the lock.
interface ClaimBody {
  teamId: string;
  token?: string;
  clientId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ClaimBody;
    if (!body.teamId || !body.clientId) {
      return NextResponse.json({ error: "teamId and clientId required" }, { status: 400 });
    }
    let holder = false;
    let changed = false;
    await mutateGameState((s) => {
      const team = s.teams[body.teamId];
      if (!team) throw new Error(`unknown team ${body.teamId}`);
      if (team.writeToken && body.token !== team.writeToken) {
        // Wrong/no token — never a holder.
        holder = false;
        return s;
      }
      if (!team.writerClientId || team.writerClientId === body.clientId) {
        if (team.writerClientId !== body.clientId) changed = true;
        team.writerClientId = body.clientId;
        holder = true;
      } else {
        holder = false;
      }
      return s;
    });
    // Let other devices/the facilitator see the lock change promptly.
    if (changed) await broadcast("game:updated", {}).catch(() => {});
    return NextResponse.json({ holder });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[claim-writer] error", err);
    return NextResponse.json({ error: e?.message ?? "claim failed" }, { status: 500 });
  }
}
