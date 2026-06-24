import Link from "next/link";
import { Redis } from "@upstash/redis";
import AxiomAvatar from "@/components/AxiomAvatar";

const SEED_COUNT = 37;

async function getPlayerCount(): Promise<number> {
  const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!hasRedis) return SEED_COUNT;
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
  const count = await redis.get<number>("duel:total_players");
  return (count ?? 0) + SEED_COUNT;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const playerCount = await getPlayerCount();
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(60px, 15vw, 120px) clamp(16px, 5vw, 28px)", position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>

      {/* terminal window — hero */}
      <div className="terminal-window" style={{ padding: 0 }}>
        <div style={{ padding: "clamp(28px, 7vw, 48px) clamp(20px, 5vw, 32px)", textAlign: "center" }}>
          {/* AXIOM identity */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28 }}>
            <AxiomAvatar size={56} />
            <div style={{ textAlign: "left" }}>
              <div className="accent-text glow" style={{ fontSize: 22, fontWeight: 700 }}>AXIOM</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>sales evaluator // online</div>
            </div>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: "clamp(26px, 7vw, 42px)", lineHeight: 1.2, margin: "0 0 16px 0" }}>
            Sharpen your sales instincts <span className="accent-text glow">against an AI that is hard to persuade.</span>
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 4vw, 18px)", margin: "0 0 32px 0" }}>
            One AI buyer. Ten minutes. Can you close the deal?
          </p>

          {/* Player count badge */}
          <div className="player-count-banner" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "16px 24px", borderRadius: 12, background: "linear-gradient(135deg, rgba(0, 245, 160, 0.12) 0%, rgba(123, 47, 255, 0.1) 100%)", width: "100%", position: "relative", overflow: "hidden", marginBottom: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="glow" style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>{playerCount}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>players</span>
            </div>
            <div style={{ height: 40, width: 2, background: "linear-gradient(180deg, transparent, var(--accent-primary), transparent)", opacity: 0.5 }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>have played before you</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>AXIOM scores you relative to them</div>
            </div>
          </div>

          {/* Big flashy CTA */}
          <Link
            href="/duel"
            className="glow-box"
            style={{ display: "inline-block", padding: "18px 48px", background: "var(--accent-primary)", color: "#040d08", borderRadius: 10, fontSize: 19, fontWeight: 800, textDecoration: "none", letterSpacing: "0.04em", transition: "transform 150ms" }}
          >
            START PLAYING
          </Link>
        </div>
      </div>

      {/* footer */}
      <p style={{ marginTop: 40, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", opacity: 0.5 }}>
        A fictional sales-training simulation. All buyers and scenarios are invented. This is a personal project by Rahul Kothari. No association with any company.
      </p>
      <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, opacity: 0.5 }}>
        <a href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Privacy</a>
        <span style={{ margin: "0 8px", color: "var(--text-secondary)" }}>·</span>
        <a href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Terms</a>
      </div>
    </main>
  );
}
