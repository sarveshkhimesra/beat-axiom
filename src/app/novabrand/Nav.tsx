"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export function Nav() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/novabrand" className="text-lg font-extrabold tracking-tight text-slate-900">
          Nova<span className="text-violet-600">Brand</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/novabrand" className="hover:text-slate-900">Home</Link>
          <Link href="/novabrand/products" className="hover:text-slate-900">Shop</Link>
          <Link href="/novabrand/about" className="hover:text-slate-900">About</Link>
          <Link href="/novabrand/cart" className="relative rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white hover:bg-slate-700">
            Cart
            {count > 0 && (
              <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-xs font-bold text-slate-900">{count}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
