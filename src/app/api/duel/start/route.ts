import { NextRequest, NextResponse } from "next/server";
import { trackPlayer } from "@/lib/duel/store";

export const runtime = "nodejs";

interface Body {
  playerName: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const name = body.playerName?.trim();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const { playCount } = await trackPlayer(name);
  return NextResponse.json({ playCount });
}
