import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { StageNumber } from "@/lib/types";
import { COMPANIES } from "@/lib/content/companies";

export const runtime = "nodejs";

// Manual, facilitator-driven elimination. The facilitator can cut 0 or any
// number of teams at any stage. `reason` controls how the projector announces
// it:
//   - "normal"  → "<Company> is eliminated."
//   - "ai"      → framed as an AXIOM integrity catch: AI-assisted play detected.
//   - "restore" → undo a cut (mistake / changed their mind).
interface EliminateBody {
  teamId: string;
  reason: "normal" | "ai" | "restore";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as EliminateBody;
    if (!body?.teamId) {
      return NextResponse.json({ error: "teamId required" }, { status: 400 });
    }
    const reason = body.reason ?? "normal";
    if (!["normal", "ai", "restore"].includes(reason)) {
      return NextResponse.json({ error: "invalid reason" }, { status: 400 });
    }

    const state = await mutateGameState((s) => {
      const team = s.teams[body.teamId];
      if (!team) throw new Error(`unknown team ${body.teamId}`);
      const co = team.company ? COMPANIES[team.company].name : team.playerName;

      if (reason === "restore") {
        team.eliminated = false;
        team.eliminatedAtStage = null;
        team.eliminatedReason = null;
        // Clear the announcement if it was pointing at this team.
        if (s.elimAnnounce?.teamId === body.teamId) s.elimAnnounce = null;
        pushConsole(s, `axiom roster --restore team_${team.id}`, `${co} reinstated · back in The Deal ✓`);
        return s;
      }

      team.eliminated = true;
      team.eliminatedAtStage = s.stage as StageNumber;
      team.eliminatedReason = reason;
      s.elimAnnounce = { teamId: body.teamId, reason, at: Date.now() };
      pushConsole(
        s,
        reason === "ai"
          ? `axiom integrity --flag team_${team.id} --signal ai-assist`
          : `axiom roster --cut team_${team.id} --round ${s.stage}`,
        reason === "ai"
          ? `INTEGRITY FLAG · AI-assisted play detected · ${co} eliminated ✗`
          : `${co} eliminated @ round ${s.stage} ✗`,
      );
      return s;
    });

    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[eliminate] error", err);
    return NextResponse.json({ error: e?.message ?? "eliminate failed" }, { status: 500 });
  }
}
