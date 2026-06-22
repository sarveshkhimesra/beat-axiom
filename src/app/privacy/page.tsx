import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Beat AXIOM",
  description: "How Beat AXIOM handles your data.",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px, 5vw, 48px)" }}>
      <div className="terminal-window" style={{ padding: "clamp(24px, 5vw, 40px)" }}>
        <h1 className="accent-text glow" style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Privacy Policy
        </h1>
        <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 16 }}>
            <strong>Beat AXIOM</strong> is a fictional sales-training simulation. We collect the minimum data necessary to run the game and prevent abuse.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>What we collect</h2>
          <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>Game transcripts (your questions and the AI buyer's replies) — used to generate your scorecard</li>
            <li>IP address — used for rate-limiting and abuse prevention</li>
            <li>Score and verdict data — stored for 90 days to generate shareable scorecards</li>
          </ul>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>What we do NOT collect</h2>
          <ul style={{ marginLeft: 20, marginBottom: 16 }}>
            <li>No personal identifiers (name, email, phone, address)</li>
            <li>No cookies or tracking pixels</li>
            <li>No analytics or third-party ad scripts</li>
          </ul>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>Third parties</h2>
          <p style={{ marginBottom: 16 }}>
            We use <strong>Anthropic</strong> (via an API) to power the AI buyer and evaluator. Transcripts are sent to Anthropic for processing and are subject to Anthropic's data-retention policies. We do not share data with any other third party.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>Retention</h2>
          <p style={{ marginBottom: 16 }}>
            Shareable scorecards are stored for 90 days, after which they are automatically deleted. Game transcripts are not retained beyond scorecard generation.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>Contact</h2>
          <p>
            Questions? Reach out via the GitHub repository or contact the maintainer listed there.
          </p>
        </div>
        <div style={{ marginTop: 32 }}>
          <Link href="/" className="accent-text" style={{ fontSize: 14 }}>
            $ ./start-duel
          </Link>
        </div>
      </div>
    </main>
  );
}
