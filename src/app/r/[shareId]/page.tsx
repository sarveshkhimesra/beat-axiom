import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/duel/store";
import { buildShareText } from "@/lib/duel/shareText";
import ShareButtons from "./ShareButtons";
import AxiomAvatar from "@/components/AxiomAvatar";

export const runtime = "nodejs";

function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  // Vercel injects the deployment/production domain at runtime.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export async function generateMetadata({ params }: { params: { shareId: string } }): Promise<Metadata> {
  const session = await getSession(params.shareId);
  const ogUrl = `${baseUrl()}/og/${params.shareId}`;
  const title = session
    ? `I scored ${session.verdict.score}/100 on Beat AXIOM — "${session.verdict.title}"`
    : "Beat AXIOM — an AI sales duel by Rahul Kothari";
  const description = session?.verdict.roast ?? "Take the 5-minute sales duel and see what AXIOM makes of you.";
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function ScorecardPage({ params }: { params: { shareId: string } }) {
  const session = await getSession(params.shareId);
  if (!session) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
        <h1 className="font-mono-display">Scorecard not found</h1>
        <p style={{ color: "var(--text-secondary)" }}>This card may have expired.</p>
        <Link href="/" className="accent-text">→ Take the duel</Link>
      </main>
    );
  }
  const v = session.verdict;
  const shareUrl = `${baseUrl()}/r/${session.shareId}`;
  const postText = buildShareText(v, shareUrl);
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(20px, 5vw, 48px)", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
        <AxiomAvatar size={72} />
        <div className="font-mono-display" style={{ color: "var(--accent-secondary)", letterSpacing: 2, marginTop: 8, fontSize: 13 }}>AXIOM HAS SPOKEN</div>
      </div>
      <div className="surface" style={{ padding: "clamp(20px, 5vw, 32px)", borderRadius: 12 }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "clamp(12px, 3.2vw, 15px)" }} className="font-mono-display">
          BEAT AXIOM · {session.scenarioTitle} · an AI by Rahul Kothari
        </div>
        <div style={{ fontSize: "clamp(64px, 18vw, 96px)", lineHeight: 1.05 }} className="font-mono-display accent-text">{v.score}<span style={{ fontSize: "clamp(24px, 6vw, 32px)", color: "var(--text-secondary)" }}>/100</span></div>
        <div style={{ fontSize: "clamp(20px, 5vw, 28px)", color: "var(--accent-secondary)" }}>“{v.title}” · better than {session.percentile}% of players</div>
        <p style={{ marginTop: 24, fontSize: "clamp(17px, 4.5vw, 20px)", lineHeight: 1.45 }}>AXIOM: “{v.roast}”</p>
      </div>
      <ShareButtons shareUrl={shareUrl} postText={postText} />
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Link href="/" className="accent-text font-mono-display" style={{ fontSize: 22 }}>→ Think you can beat me? Take the duel</Link>
      </div>
    </main>
  );
}
