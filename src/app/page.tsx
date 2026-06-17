import Link from "next/link";
import AxiomAvatar from "@/components/AxiomAvatar";

export const runtime = "nodejs";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(40px, 10vw, 80px) clamp(16px, 5vw, 28px)", position: "relative" }}>
      {/* subtle corner attribution */}
      <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, color: "var(--text-secondary)", opacity: 0.5 }}>
        rahul kothari built the game
      </div>

      {/* terminal window */}
      <div className="terminal-window" style={{ padding: 0 }}>
        {/* header bar is rendered by ::before (traffic lights) */}
        <div style={{ padding: "clamp(24px, 6vw, 40px) clamp(20px, 5vw, 32px)" }}>
          {/* AXIOM identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <AxiomAvatar size={52} />
            <div>
              <div className="accent-text glow" style={{ fontSize: 20, fontWeight: 700 }}>AXIOM</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>sales evaluator // online</div>
            </div>
          </div>

          {/* typed prompt */}
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>
            axiom@beat ~ $
          </div>
          <h1 style={{ fontSize: "clamp(24px, 6vw, 38px)", lineHeight: 1.2, margin: "0 0 20px 0" }}>
            An AI that grades your sales instincts <span className="accent-text glow">the way an elite operator would.</span>
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "clamp(14px, 3.8vw, 17px)", margin: "0 0 32px 0" }}>
            One buyer. Seven questions. No second chances. Most people score under 50.
          </p>

          {/* CTA */}
          <Link
            href="/duel"
            className="glow-box"
            style={{ display: "inline-block", padding: "14px 28px", background: "var(--accent-primary)", color: "#040d08", borderRadius: 8, fontSize: 17, fontWeight: 700, textDecoration: "none", letterSpacing: "0.03em" }}
          >
            ./start-duel<span className="cursor"></span>
          </Link>
        </div>
      </div>

      {/* footer */}
      <p style={{ marginTop: 40, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", opacity: 0.6 }}>
        A fictional sales-training simulation. All buyers and scenarios are invented.
      </p>
    </main>
  );
}
