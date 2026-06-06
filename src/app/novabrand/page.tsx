import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { NB_BESTSELLERS } from "./products";

const STATS: [string, string][] = [
  ["₹800Cr+", "Annual GMV"],
  ["6M+", "Happy customers"],
  ["800K+", "Orders / month"],
  ["80 → 300", "Retail stores"],
];

export default function NovaBrandHome() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-900 to-violet-700 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 sm:py-28 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-violet-200">
              India&apos;s fastest-growing D2C brand
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Everyday tech, beautifully done.
            </h1>
            <p className="mt-4 max-w-md text-lg text-violet-100">
              Earbuds, smartwatches, skincare and lifestyle essentials — designed in-house, delivered to your
              door or any of our 80+ stores.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/novabrand/products" className="rounded-xl bg-amber-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-300">
                Shop the collection
              </Link>
              <Link href="/novabrand/about" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                About NovaBrand
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <div className="text-3xl font-extrabold">{n}</div>
                <div className="mt-1 text-sm text-violet-200">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About blurb */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Loved across India</h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          NovaBrand is India&apos;s fastest-growing direct-to-consumer lifestyle brand — audio, wearables, skincare
          and home, sold online and across a fast-expanding retail network. We design in-house, ship at scale,
          and obsess over the unboxing.
        </p>
      </section>

      {/* Bestsellers */}
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Bestsellers</h2>
          <Link href="/novabrand/products" className="text-sm font-semibold text-violet-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NB_BESTSELLERS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
