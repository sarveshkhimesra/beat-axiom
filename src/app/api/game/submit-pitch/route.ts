import { NextRequest, NextResponse } from "next/server";
import { mutateGameState } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { StageNumber } from "@/lib/types";

export const runtime = "nodejs";

interface SubmitBody {
  teamId: string;
  pitch: string;
  token?: string; // captain's write-access token
  clientId?: string; // the device holding the write seat
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SubmitBody;
    if (!body.teamId || typeof body.pitch !== "string") {
      return NextResponse.json({ error: "teamId and pitch required" }, { status: 400 });
    }
    const pitch = body.pitch.trim();
    if (pitch.length < 20) {
      return NextResponse.json({ error: "pitch is too short" }, { status: 400 });
    }

    const state = await mutateGameState((s) => {
      if (s.status !== "stage-active" || s.stagePhase !== "pitch") {
        throw new Error("pitches can only be submitted during the pitch phase");
      }
      const team = s.teams[body.teamId];
      if (!team) throw new Error(`unknown team ${body.teamId}`);
      if (team.eliminated) throw new Error("team is eliminated");
      // Write-access gate (captain link only; legacy games with no token = open).
      if (team.writeToken && body.token !== team.writeToken) {
        throw new Error("view-only — you need this team's captain link to submit");
      }
      // Single-device lock: only the device that claimed the seat may submit.
      if (team.writerClientId && body.clientId !== team.writerClientId) {
        throw new Error("this team is being controlled on another device");
      }
      // One pitch per stage. Idempotent re-submit overwrites until the stage ends.
      team.stageSubmissions[s.stage as StageNumber] = pitch;
      return s;
    });

    broadcast("game:updated", {}).catch((err) =>
      console.error("[submit-pitch] broadcast failed", err),
    );
    return NextResponse.json({ ok: true, state });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/submit-pitch] error", err);
    return NextResponse.json({ error: e?.message ?? "submit-pitch failed" }, { status: 400 });
  }
}
