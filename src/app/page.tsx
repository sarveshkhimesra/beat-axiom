import Link from "next/link";

export const runtime = "nodejs";

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(48px, 12vw, 96px) clamp(20px, 5vw, 32px)", textAlign: "center", position: "relative" }}>
      <div className="font-mono-display" style={{ position: "absolute", top: 16, left: 16, fontSize: 12, color: "var(--text-secondary)", opacity: 0.65 }}>
        rahul kothari built the game
      </div>
      <div className="font-mono-display" style={{ color: "var(--text-secondary)", letterSpacing: 2 }}>BEAT AXIOM</div>
      <h1 className="font-mono-display" style={{ fontSize: "clamp(30px, 7vw, 48px)", marginTop: 16, lineHeight: 1.12 }}>
        An AI that grades your sales instincts <span className="accent-text">the way an elite operator would.</span>
      </h1>
      <p style={{ fontSize: "clamp(17px, 4.5vw, 22px)", color: "var(--text-secondary)", marginTop: 24 }}>
        AXIOM doesn’t do small talk. One buyer, seven questions, no second chances. Most people score under 50.
      </p>
      <Link href="/duel" className="font-mono-display" style={{ display: "inline-block", marginTop: 40, padding: "16px 32px", background: "var(--accent-primary)", color: "#04110b", borderRadius: 10, fontSize: 20, textDecoration: "none" }}>
        Take the duel →
      </Link>
      <p style={{ marginTop: 64, fontSize: 13, color: "var(--text-secondary)" }}>
        A fictional sales-training simulation. All buyers, companies, and scenarios are invented. AXIOM is a fictional AI character. An AI by Rahul Kothari.
      </p>
    </main>
  );
}
