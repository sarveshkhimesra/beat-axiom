"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[AXIOM] global error:", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 48 }}>
      <div className="terminal-window" style={{ padding: 32 }}>
        <div className="accent-text glow" style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          [AXIOM] SYSTEM FAILURE
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          Something went wrong on our end. AXIOM is still processing — give it a moment, then try again.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ padding: "10px 20px", fontSize: 14 }}
        >
          ./retry
        </button>
      </div>
    </main>
  );
}
