import { NextRequest, NextResponse } from "next/server";
import { mutateGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";

export const runtime = "nodejs";

interface Body {
  chatEnabled?: boolean;
}

// Facilitator toggle: allow teams to TYPE in addition to speaking (fallback for
// when voice input doesn't cooperate on the day). Default is voice-only.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const on = !!body.chatEnabled;
    const state = await mutateGameState((s) => {
      s.chatEnabled = on;
      pushConsole(
        s,
        `curl -sXPOST $DEAL/api/input-mode -d chat=${on ? "on" : "off"}`,
        on ? "200 · team input: VOICE + CHAT" : "200 · team input: VOICE ONLY",
      );
      return s;
    });
    await broadcast("game:updated", {});
    return NextResponse.json({ state });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "input-mode failed" }, { status: 400 });
  }
}
