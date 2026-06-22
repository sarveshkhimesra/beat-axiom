"use client";

import { useEffect } from "react";

export default function DuelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[duel] error:", error);
  }, [error]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <div className="terminal-window" style={{ padding: 24 }}>
        <div className="danger-text" style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          [axiom] duel interrupted
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
          AXIOM lost the signal. The buyer is still waiting — try reconnecting.
        </p>
        <button
          onClick={reset}
          className="btn btn-primary"
          style={{ padding: "10px 18px", fontSize: 14 }}
        >
          ./reconnect
        </button>
      </div>
    </main>
  );
}
