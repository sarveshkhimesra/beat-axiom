import Link from "next/link";
import AxiomAvatar from "@/components/AxiomAvatar";
import { getSeedLeaderboard, LeaderboardEntry } from "@/lib/duel/seedLeaderboard";
import { getLeaderboard } from "@/lib/duel/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const seed = getSeedLeaderboard();
  const real = await getLeaderboard(50);

  // Merge: real players override seed entries with same name, then combine and sort
  const nameMap = new Map<string, LeaderboardEntry>();
  for (const entry of seed) {
    nameMap.set(entry.name.toLowerCase(), entry);
  }
  for (const entry of real) {
    const key = entry.name.toLowerCase();
    const existing = nameMap.get(key);
    if (!existing || entry.score > existing.score) {
      nameMap.set(key, entry);
    }
  }
  const entries = [...nameMap.values()].sort((a, b) => b.score - a.score);

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(24px, 5vw, 48px) clamp(16px, 5vw, 28px)" }}>
      <div className="terminal-window" style={{ padding: 0 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <AxiomAvatar size={36} />
          <div>
            <div className="accent-text glow" style={{ fontSize: 18, fontWeight: 700 }}>LEADERBOARD</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{entries.length} players ranked</div>
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: "0" }}>
          {entries.map((entry, i) => {
            const isTop3 = i < 3;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  background: isTop3 ? "rgba(0, 245, 160, 0.03)" : "transparent",
                }}
              >
                {/* Rank */}
                <div style={{ width: 36, fontSize: medal ? 18 : 14, color: "var(--text-secondary)", fontWeight: 600 }}>
                  {medal ?? `${i + 1}`}
                </div>
                {/* Name + Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: isTop3 ? 600 : 400, color: "var(--text-primary)" }}>
                    {entry.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--accent-secondary)", opacity: 0.8 }}>
                    {entry.title}
                  </div>
                </div>
                {/* Score */}
                <div style={{ fontSize: isTop3 ? 20 : 16, fontWeight: 700, fontFamily: "monospace", color: isTop3 ? "var(--accent-primary)" : "var(--text-primary)" }}>
                  {entry.score}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/" className="glow-box" style={{ display: "inline-block", padding: "12px 24px", background: "var(--accent-primary)", color: "#040d08", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
          Play and get on the board
        </Link>
      </div>
    </main>
  );
}
