import Link from "next/link";

export const runtime = "nodejs";

export default function Home() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "96px 32px", textAlign: "center" }}>
      <div className="font-mono-display" style={{ color: "var(--text-secondary)", letterSpacing: 2 }}>BEAT AXIOM</div>
      <h1 className="font-mono-display" style={{ fontSize: 48, marginTop: 16, lineHeight: 1.1 }}>
        Rahul Kothari trained an AI to grade sales conversations <span className="accent-text">the way he does.</span>
      </h1>
      <p style={{ fontSize: 22, color: "var(--text-secondary)", marginTop: 24 }}>
        AXIOM doesn’t do small talk. One buyer, five minutes, no second chances. Most people score under 50.
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
