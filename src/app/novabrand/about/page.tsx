const STATS: [string, string][] = [
  ["₹800Cr+", "Annual GMV"],
  ["6M+", "Customers"],
  ["800K+", "Orders / month"],
  ["80 → 300", "Retail stores"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-3xl font-extrabold text-slate-900">About NovaBrand</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        NovaBrand is India&apos;s fastest-growing direct-to-consumer lifestyle brand. From audio and wearables to
        skincare and home, we design in-house, manufacture at scale, and deliver delight to 6 million+ customers
        — online and across 80 stores, expanding to 300.
      </p>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        We process over 800,000 orders a month, heading into our Series B. As we scale, we&apos;re
        consolidating a payments stack that today runs across three providers — because a checkout this big deserves
        infrastructure that just works.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(([n, l]) => (
          <div key={l} className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <div className="text-2xl font-extrabold text-slate-900">{n}</div>
            <div className="mt-1 text-sm text-slate-500">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
