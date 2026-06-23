"use client";

import { useEffect, useState } from "react";
import { sfx } from "@/lib/duel/sfx";

export default function ShareButtons({
  shareUrl,
  linkedInText,
  twitterText,
}: {
  shareUrl: string;
  linkedInText: string;
  twitterText: string;
}) {
  const [copied, setCopied] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Dramatic chime when the verdict scorecard appears.
  useEffect(() => {
    sfx.reveal();
  }, []);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;

  async function copyCaption(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(linkedInText);
      return true;
    } catch {
      return false;
    }
  }

  async function onLinkedIn() {
    const ok = await copyCaption();
    setHint(
      ok
        ? "Caption copied — paste it into your post (the @ tags Rahul), and your scorecard unfurls below."
        : "Opening LinkedIn — paste your caption to tag Rahul.",
    );
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  }

  function onX() {
    setHint(null);
    window.open(xUrl, "_blank", "noopener,noreferrer");
  }

  async function onCopy() {
    const ok = await copyCaption();
    setCopied(ok);
    setHint(ok ? "Caption + link copied to clipboard." : "Couldn't copy — select the text manually.");
    if (ok) setTimeout(() => setCopied(false), 2500);
  }

  const btn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 18px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    fontSize: 16,
    cursor: "pointer",
    fontWeight: 600,
    color: "#fff",
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div className="font-mono-display" style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 12 }}>
        SHARE YOUR VERDICT
      </div>

      {/* Show the caption text so users know what gets copied */}
      <div style={{ padding: "12px 14px", background: "var(--bg-primary)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 16, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {linkedInText}
      </div>

      <div className="share-stack" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <button onClick={onLinkedIn} style={{ ...btn, background: "#0a66c2", borderColor: "#0a66c2" }}>
          in&nbsp; Copy &amp; Share on LinkedIn
        </button>
        <button onClick={onX} style={{ ...btn, background: "#000", borderColor: "#333" }}>
          𝕏&nbsp; Share on X
        </button>
        <button onClick={onCopy} style={{ ...btn, background: "var(--bg-surface)", color: "var(--text-primary)" }}>
          {copied ? "✓ Copied" : "⧉ Copy caption"}
        </button>
      </div>
      {hint && (
        <p style={{ marginTop: 12, fontSize: 14, color: "var(--accent-primary)", fontWeight: 600 }}>{hint}</p>
      )}
    </div>
  );
}
