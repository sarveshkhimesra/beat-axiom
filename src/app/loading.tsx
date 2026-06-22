export default function GlobalLoading() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 48, textAlign: "center" }}>
      <div className="terminal-window" style={{ padding: 32 }}>
        <div className="accent-text glow" style={{ fontSize: 18, fontWeight: 700 }}>
          [AXIOM] initializing...
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12 }}>
          loading simulation modules
        </div>
      </div>
    </main>
  );
}
