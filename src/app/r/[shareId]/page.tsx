import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/duel/store";
import { buildShareText } from "@/lib/duel/shareText";
import ShareButtons from "./ShareButtons";
import AxiomAvatar from "@/components/AxiomAvatar";

export const runtime = "nodejs";

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  if (!/^[A-Za-z0-9_-]{6,21}$/.test(shareId)) {
    return {};
  }
  const session = await getSession(shareId);
  const ogUrl = `${baseUrl()}/og/${shareId}`;
  const title = session
    ? `I scored ${session.verdict.score}/100 on Beat AXIOM — "${session.verdict.title}"`
    : "Beat AXIOM — an AI sales duel by Rahul Kothari";
  const description = session?.verdict.roast ?? "Ten minutes. One verdict. Can you beat AXIOM?";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Beat AXIOM",
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `Beat AXIOM scorecard: ${session?.verdict.score ?? 0}/100` }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@rahulkothari",
      creator: "@rahulkothari",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function ScorecardPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  if (!/^[A-Za-z0-9_-]{6,21}$/.test(shareId)) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
        <div className="terminal-window" style={{ padding: "32px" }}>
          <p style={{ color: "var(--text-secondary)" }}>[axiom] scorecard not found. it may have expired.</p>
          <Link href="/" className="accent-text" style={{ marginTop: 16, display: "inline-block" }}>$ ./start-duel</Link>
        </div>
      </main>
    );
  }
  const session = await getSession(shareId);
  if (!session) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
        <div className="terminal-window" style={{ padding: "32px" }}>
          <p style={{ color: "var(--text-secondary)" }}>[axiom] scorecard not found. it may have expired.</p>
          <Link href="/" className="accent-text" style={{ marginTop: 16, display: "inline-block" }}>$ ./start-duel</Link>
        </div>
      </main>
    );
  }
  const v = session.verdict;
  const shareUrl = `${baseUrl()}/r/${session.shareId}`;
  const postText = buildShareText(v, shareUrl);
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(16px, 4vw, 40px)", width: "100%", boxSizing: "border-box" }}>
      <div className="terminal-window" style={{ padding: 0 }}>
        {/* AXIOM identity header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <AxiomAvatar size={48} />
          <div>
            <div className="accent-text glow" style={{ fontSize: 18, fontWeight: 700 }}>AXIOM // VERDICT</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{session.scenarioTitle} · built by rahul kothari</div>
          </div>
        </div>

        {/* score dump */}
        <div style={{ padding: "clamp(20px, 5vw, 32px)" }}>
          <h1 style={{ fontSize: "clamp(72px, 20vw, 110px)", lineHeight: 1, fontWeight: 700, margin: 0 }} className="accent-text glow">
            {v.score}<span style={{ fontSize: "clamp(24px, 6vw, 36px)", color: "var(--text-secondary)", fontWeight: 400 }}>/100</span>
          </h1>
          <div style={{ fontSize: "clamp(20px, 5vw, 28px)", color: "var(--accent-secondary)", marginTop: 8 }}>
            &quot;{v.title}&quot;
          </div>

          {/* roast */}
          <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--bg-primary)", borderRadius: 8, borderLeft: "3px solid var(--accent-secondary)" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>axiom.verdict.roast &gt;</div>
            <p style={{ fontSize: "clamp(15px, 4vw, 18px)", lineHeight: 1.5, margin: 0 }}>&quot;{v.roast}&quot;</p>
          </div>

          {/* best/worst */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--accent-primary)", fontSize: 11, marginBottom: 4 }}>best_line &gt;</div>
              &quot;{v.bestLine}&quot;
            </div>
            <div style={{ fontSize: 13 }}>
              <div style={{ color: "var(--accent-danger)", fontSize: 11, marginBottom: 4 }}>worst_line &gt;</div>
              &quot;{v.worstLine}&quot;
            </div>
          </div>
        </div>
      </div>

      {/* share + CTA */}
      <ShareButtons shareUrl={shareUrl} postText={postText} />
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link href="/" className="accent-text" style={{ fontSize: 16 }}>$ ./start-duel — try again</Link>
      </div>
    </main>
  );
}
