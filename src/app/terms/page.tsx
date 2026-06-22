import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Beat AXIOM",
  description: "Terms for using Beat AXIOM.",
};

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px, 5vw, 48px)" }}>
      <div className="terminal-window" style={{ padding: "clamp(24px, 5vw, 40px)" }}>
        <h1 className="accent-text glow" style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
          Terms of Service
        </h1>
        <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 16 }}>
            <strong>Beat AXIOM</strong> is a fictional sales-training simulation provided for entertainment and educational purposes. By using this service, you agree to the following terms.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>1. No guarantees</h2>
          <p style={{ marginBottom: 16 }}>
            The AI evaluator (AXIOM) provides subjective scoring based on a rubric. Scores are not professional advice, certification, or endorsement of any real-world sales capability.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>2. Content you create</h2>
          <p style={{ marginBottom: 16 }}>
            You retain ownership of questions you type into the game. By playing, you grant us a limited license to process your input through our AI provider (Anthropic) to generate the game experience and scorecard.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>3. Abuse and limits</h2>
          <p style={{ marginBottom: 16 }}>
            We reserve the right to rate-limit, block, or pause the service (via the <code>DUEL_PAUSED</code> kill switch) to prevent abuse, API overuse, or unexpected costs.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>4. Disclaimers</h2>
          <p style={{ marginBottom: 16 }}>
            All buyers, companies, and scenarios are fictional. Any resemblance to real persons is coincidental. The service is provided "as is" without warranty of any kind.
          </p>
          <h2 style={{ color: "var(--accent-primary)", fontSize: 16, fontWeight: 600, margin: "20px 0 8px" }}>5. Changes</h2>
          <p>
            These terms may change as the service evolves. Continued use after changes constitutes acceptance.
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
