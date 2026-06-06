"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "../CartContext";

const OFFERS = [
  { code: "NOVA10", label: "10% instant discount on HDFC Bank credit cards (min. order ₹2,500)." },
  { code: "UPI50", label: "Flat ₹50 cashback on UPI payments over ₹999." },
  { code: "EMI0", label: "No-cost EMI from 3–12 months on orders above ₹3,000." },
];

export default function CartPage() {
  const { items, setQty, remove, subtotal, coupon, applyCoupon, discount } = useCart();
  const [code, setCode] = useState("");
  const shipping = items.length && subtotal < 2000 ? 49 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <Link href="/novabrand/products" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-6 text-3xl font-extrabold text-slate-900">Your cart</h1>
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="h-16 w-16 flex-shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${i.color}, ${i.color}bb)` }} />
            <div className="flex-1">
              <div className="font-bold text-slate-900">{i.name}</div>
              <div className="text-sm text-slate-500">₹{i.price.toLocaleString("en-IN")}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(i.id, i.qty - 1)} className="h-8 w-8 rounded-lg border border-slate-300 text-lg leading-none text-slate-700 hover:bg-slate-100">−</button>
              <span className="w-6 text-center font-semibold">{i.qty}</span>
              <button onClick={() => setQty(i.id, i.qty + 1)} className="h-8 w-8 rounded-lg border border-slate-300 text-lg leading-none text-slate-700 hover:bg-slate-100">+</button>
            </div>
            <div className="w-20 text-right font-bold text-slate-900">₹{(i.price * i.qty).toLocaleString("en-IN")}</div>
            <button onClick={() => remove(i.id)} className="text-sm text-slate-400 hover:text-rose-600">✕</button>
          </div>
        ))}
      </div>

      {/* Offers — each "Apply" link only FILLS the code; you must still click Apply (gap) */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="text-sm font-semibold text-amber-900">Available offers</div>
        <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
          {OFFERS.map((o) => (
            <li key={o.code} className="flex items-start justify-between gap-3">
              <span>• {o.label}</span>
              <button onClick={() => setCode(o.code)} className="shrink-0 font-semibold text-amber-700 underline">Apply</button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
          />
          <button onClick={() => applyCoupon(code)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">
            Apply
          </button>
        </div>
        {coupon && discount > 0 && <div className="mt-2 text-xs font-medium text-emerald-700">Coupon {coupon} applied — ₹{discount} off.</div>}
        {coupon && discount === 0 && <div className="mt-2 text-xs font-medium text-rose-600">Code {coupon} isn&apos;t valid on this cart.</div>}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
        {discount > 0 && <div className="mt-1 flex justify-between text-sm text-emerald-700"><span>Discount ({coupon})</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>}
        <div className="mt-1 flex justify-between text-sm text-slate-600"><span>Shipping</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-extrabold text-slate-900">
          <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <Link href="/novabrand/checkout" className="mt-4 block rounded-xl bg-slate-900 py-3 text-center font-semibold text-white hover:bg-slate-700">
          Proceed to checkout →
        </Link>
      </div>
    </div>
  );
}
