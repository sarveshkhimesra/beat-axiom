import Link from "next/link";

export default function Home() {
  const links = [
    { href: "/facilitator", label: "Facilitator", desc: "Control panel — start here" },
    { href: "/projector", label: "Projector", desc: "TV / projector display" },
    { href: "/team/1", label: "Team 1", desc: "" },
    { href: "/team/2", label: "Team 2", desc: "" },
    { href: "/team/3", label: "Team 3", desc: "" },
    { href: "/team/4", label: "Team 4", desc: "" },
    { href: "/team/5", label: "Team 5", desc: "" },
  ];
  return (
    <main className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-mono-display accent-text mb-2">
        THE DEAL SALES CHAMPIONSHIP
      </h1>
      <p className="muted-text mb-8 font-mono-display text-sm">
        // Phase 1 — Core Game Engine
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="surface p-4 rounded hover:border-[var(--accent-primary)] transition-colors"
          >
            <div className="font-mono-display text-base">{l.label}</div>
            {l.desc && <div className="muted-text text-xs mt-1">{l.desc}</div>}
          </Link>
        ))}
      </div>
    </main>
  );
}
