"use client";

import { useState } from "react";
import { NbProduct } from "./products";
import { useCart } from "./CartContext";

export function ProductCard({ product }: { product: NbProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const off = Math.round((1 - product.price / product.mrp) * 100);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-44" style={{ background: `linear-gradient(135deg, ${product.color}, ${product.color}bb)` }}>
        {product.bestseller && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800">
            Bestseller
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
          {off}% off
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-violet-600">{product.category}</div>
        <div className="mt-1 font-bold text-slate-900">{product.name}</div>
        <p className="mt-1 flex-1 text-sm text-slate-500">{product.tagline}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-slate-900">₹{product.price.toLocaleString("en-IN")}</span>
          <span className="text-sm text-slate-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</span>
        </div>
        <button
          onClick={() => { add(product); setAdded(true); setTimeout(() => setAdded(false), 1200); }}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
