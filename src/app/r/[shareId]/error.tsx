"use client";

import Link from "next/link";

export default function ShareError({ error }: { error: Error & { digest?: string } }) {
  console.error("[share] error:", error);
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
      <div className="terminal-window" style={{ padding: 32 }}>
        <div className="accent-text" style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          [AXIOM] scorecard unavailable
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
          That scorecard could not be loaded. It may have expired or the link is incorrect.
        </p>
        <Link href="/" className="accent-text" style={{ fontSize: 14 }}>
          $ ./start-duel
        </Link>
      </div>
    </main>
  );
}
