import { ImageResponse } from "next/og";
import { getSession } from "@/lib/duel/store";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

export async function GET(_req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  if (!/^[A-Za-z0-9_-]{6,21}$/.test(shareId)) {
    return new Response("Not found", { status: 404 });
  }
  const session = await getSession(shareId);
  const score = session?.verdict.score ?? 0;
  const title = session?.verdict.title ?? "-";
  const roastFull = session?.verdict.roast ?? "AXIOM has no comment.";
  const roast = roastFull.length > 160 ? roastFull.slice(0, 157).trimEnd() + "..." : roastFull;
  const scenario = session?.scenarioTitle ?? "The Duel";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f", color: "#e8e8f0", padding: 64, fontFamily: "monospace" }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#8888aa", fontSize: 28 }}>
          <span>{`BEAT AXIOM // ${scenario}`}</span>
          <span>by Rahul Kothari</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <span style={{ fontSize: 200, color: "#00f5a0", fontWeight: 700 }}>{String(score)}</span>
          <span style={{ fontSize: 56, color: "#8888aa", marginLeft: 16 }}>/100</span>
        </div>
        <div style={{ display: "flex", fontSize: 52, color: "#7b2fff", marginTop: 4 }}>{`"${title}"`}</div>
        <div style={{ display: "flex", fontSize: 32, color: "#e8e8f0", marginTop: 28, lineHeight: 1.4 }}>{`AXIOM: "${roast}"`}</div>
      </div>
    ),
    SIZE,
  );
}
