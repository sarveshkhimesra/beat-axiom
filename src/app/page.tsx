import Link from "next/link";
import { Redis } from "@upstash/redis";
import AxiomAvatar from "@/components/AxiomAvatar";
import { CLIENT_SCENARIO_IDS, CLIENT_SCENARIOS } from "@/lib/duel/scenarios-client";
import { ScenarioId } from "@/lib/duel/types";

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

const CARD_COPY: Record<ScenarioId, string[]> = {
  "skeptical-vp": [
    "She's been burned before. That rollout you remind her of? It was hers.",
    "She talks ROI but what she really needs is a visible win — fast.",
    "Convince her this time is different.",
  ],
  "cutting-cfo": [
    "He says it's about cost. It's not.",
    "Under the spreadsheet armor, he wants to look innovative to the board.",
    "Find the real story behind the budget talk.",
  ],
  "committee-gatekeeper": [
    "She'll smile, take notes, and route you to 'the process.'",
    "The real decision-maker isn't in the room.",
    "Figure out who is — and sell through her.",
  ],
  "enthusiastic-champion": [
    "He loves your product. He's your biggest fan internally.",
    "But he can't sign anything — and his VP thinks he chases shiny objects.",
    "Leverage his energy without stepping on his toes.",
  ],
  "silent-evaluator": [
    "She barely speaks. Vague claims get silence.",
    "Hand-waving gets a raised eyebrow. Proof gets engagement.",
    "Earn her respect with specifics — or get nothing.",
  ],
};

export default async function Home() {
  const playerCount = await getPlayerCount();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(40px, 10vw, 80px) clamp(16px, 5vw, 28px)", position: "relative" }}>

      {/* terminal window — hero */}
      <div className="terminal-window" style={{ padding: 0 }}>
        <div style={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)" }}>
          {/* AXIOM identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <AxiomAvatar size={52} />
            <div>
              <div className="accent-text glow" style={{ fontSize: 20, fontWeight: 700 }}>AXIOM</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>sales evaluator // online</div>
            </div>
          </div>

          {/* headline */}
          <h1 style={{ fontSize: "clamp(24px, 6vw, 38px)", lineHeight: 1.2, margin: "0 0 20px 0" }}>
            Sharpen your sales instincts <span className="accent-text glow">against an AI that fights back.</span>
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 3.8vw, 17px)", margin: "0 0 12px 0" }}>
            One AI buyer. Ten minutes. Can you close the deal? Pick a scenario below and find out.
          </p>
          <Link href="/leaderboard" className="glow-box" style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "20px 24px", borderRadius: 12, background: "linear-gradient(135deg, rgba(0, 245, 160, 0.1) 0%, rgba(123, 47, 255, 0.08) 100%)", border: "1px solid rgba(0, 245, 160, 0.3)", textDecoration: "none", transition: "border-color 200ms, transform 200ms", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>{playerCount}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>players</span>
            </div>
            <div style={{ height: 40, width: 1, background: "var(--border)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Leaderboard is live</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>See who&apos;s on top. Can you beat them? →</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Scenario cards section */}
      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: "clamp(18px, 5vw, 24px)", marginBottom: 20, color: "var(--text-primary)" }}>
          Choose Your Buyer
        </h2>
        <div style={{ display: "grid", gap: 14 }}>
          {CLIENT_SCENARIO_IDS.map((id) => (
            <Link
              key={id}
              href={`/duel?scenario=${id}`}
              className="glow-box"
              style={{
                display: "block",
                padding: "clamp(16px, 4vw, 20px)",
                borderRadius: 10,
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                color: "var(--text-primary)",
                transition: "border-color 120ms",
              }}
            >
              <div className="accent-text" style={{ fontSize: "clamp(16px, 4vw, 19px)", fontWeight: 600, marginBottom: 8 }}>
                {CLIENT_SCENARIOS[id].title}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "clamp(13px, 3.5vw, 15px)", lineHeight: 1.6 }}>
                {CARD_COPY[id].map((line, i) => (
                  <span key={i}>{line}{i < CARD_COPY[id].length - 1 ? " " : ""}</span>
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                <span style={{ opacity: 0.6 }}>your pitch:</span>{" "}
                <span style={{ color: "var(--text-primary)", opacity: 0.85 }}>{CLIENT_SCENARIOS[id].product}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* footer */}
      <p style={{ marginTop: 40, fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
        built by rahul kothari
      </p>
      <p style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", opacity: 0.6 }}>
        A fictional sales-training simulation. All buyers and scenarios are invented. This is a personal project by Rahul Kothari and has no association with Razorpay.
      </p>
      <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, opacity: 0.5 }}>
        <a href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Privacy</a>
        <span style={{ margin: "0 8px", color: "var(--text-secondary)" }}>·</span>
        <a href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Terms</a>
      </div>
    </main>
  );
}
