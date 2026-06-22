import Link from "next/link";
import AxiomAvatar from "@/components/AxiomAvatar";
import { CLIENT_SCENARIO_IDS, CLIENT_SCENARIOS } from "@/lib/duel/scenarios-client";
import { ScenarioId } from "@/lib/duel/types";

export const runtime = "nodejs";

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

export default function Home() {
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

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 3.8vw, 17px)", margin: "0 0 0 0" }}>
            One AI buyer. Ten minutes. Can you close the deal? Pick a scenario below and find out.
          </p>
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
