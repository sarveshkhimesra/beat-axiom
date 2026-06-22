export default function DuelLoading() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 24, textAlign: "center" }}>
      <div className="terminal-window" style={{ padding: 24 }}>
        <div className="accent-text glow" style={{ fontSize: 16, fontWeight: 700 }}>
          [axiom] establishing link...
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 8 }}>
          connecting to buyer simulation
        </div>
      </div>
    </main>
  );
}
