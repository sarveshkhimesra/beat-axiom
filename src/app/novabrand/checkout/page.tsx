"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../CartContext";

type Method = "card" | "upi" | "nb" | "wallet" | "emi" | "cod";
type Step = "address" | "payment" | "processing" | "failed";

const MORE_METHODS: { id: Method; icon: string; label: string; sub: string }[] = [
  { id: "upi", icon: "📲", label: "UPI", sub: "NovaPay, ZipUPI, PayPod" },
  { id: "nb", icon: "🏦", label: "Net Banking", sub: "All major banks" },
  { id: "wallet", icon: "👛", label: "Wallets", sub: "PayPod, ZipWallet, NovaCash" },
  { id: "emi", icon: "📅", label: "EMI", sub: "No-cost EMI available" },
  { id: "cod", icon: "📦", label: "Cash on Delivery", sub: "Pay when it arrives" },
];

export default function CheckoutPage() {
  const { items, subtotal, coupon, discount } = useCart();
  const [step, setStep] = useState<Step>("address");

  // gap: no saved address / no pre-fill — always blank
  const [addr, setAddr] = useState({ name: "", phone: "", line: "", pin: "" });
  const [addrErr, setAddrErr] = useState<string[]>([]);

  const [method, setMethod] = useState<Method>("card"); // gap: opens on Card
  const [showMore, setShowMore] = useState(false); // gap: UPI hidden behind this
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" }); // gap: no saved cards
  const [payErr, setPayErr] = useState<string | null>(null);

  const shipping = items.length && subtotal < 2000 ? 49 : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  // gap: failed-payment dead-end — 3s processing, then failure with only "Back to cart"
  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setStep("failed"), 3000);
    return () => clearTimeout(t);
  }, [step]);

  function continueFromAddress() {
    // gap: validation fires ONLY on Continue
    const e: string[] = [];
    if (!addr.name) e.push("Enter your full name.");
    if (!addr.phone) e.push("Enter your phone number.");
    if (!addr.line) e.push("Enter your address.");
    if (!addr.pin) e.push("Enter your PIN code.");
    setAddrErr(e);
    if (e.length === 0) setStep("payment");
  }

  function pay() {
    // gap: card errors surface ONLY on Pay
    if (method === "card" && (!card.number || !card.name || !card.expiry || !card.cvv)) {
      setPayErr("Please enter your full card details.");
      return;
    }
    setPayErr(null);
    setStep("processing");
  }

  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  const noteBox = "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3 text-sm font-medium">
        <span className="text-slate-500">Secure Checkout · NovaBrand</span>
        <span className="text-slate-300">/</span>
        <span className={step === "address" ? "text-violet-600" : "text-slate-400"}>1 · Address</span>
        <span className="text-slate-300">→</span>
        <span className={step === "payment" ? "text-violet-600" : "text-slate-400"}>2 · Payment</span>
      </div>

      {step === "processing" && (
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
          <div className="font-semibold text-slate-700">Processing your payment…</div>
          <div className="mt-1 text-sm text-slate-400">Please don&apos;t close this window.</div>
        </div>
      )}

      {step === "failed" && (
        <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <div className="text-2xl font-bold text-rose-600">Payment failed</div>
          <p className="mt-2 text-slate-600">Something went wrong with your payment. Your cart has been saved.</p>
          {/* gap: no retry, no alternate method — the ONLY way out */}
          <Link href="/novabrand/cart" className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">
            Back to cart
          </Link>
        </div>
      )}

      {(step === "address" || step === "payment") && (
        <div className="grid gap-8 md:grid-cols-[1fr_340px]">
          <div>
            {step === "address" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900">Delivery address</h2>
                {/* gap: no saved addresses */}
                <div className={`mt-3 ${noteBox}`}>No saved addresses found.</div>
                <div className="mt-4 space-y-3">
                  <input className={input} placeholder="Full name" value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
                  <input className={input} placeholder="Phone" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
                  <input className={input} placeholder="Address" value={addr.line} onChange={(e) => setAddr({ ...addr, line: e.target.value })} />
                  <input className={input} placeholder="PIN code" value={addr.pin} onChange={(e) => setAddr({ ...addr, pin: e.target.value })} />
                </div>
                {addrErr.length > 0 && (
                  <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {addrErr.map((er, i) => <div key={i}>• {er}</div>)}
                  </div>
                )}
                <button onClick={continueFromAddress} className="mt-4 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-700">
                  Continue to payment →
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900">Payment</h2>

                {/* gap: opens on Card tab as the default */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setMethod("card")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${method === "card" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    💳 Credit / Debit Card
                  </button>
                </div>

                {method === "card" && (
                  <div className="mt-4 space-y-3">
                    {/* gap: no saved cards — blank every time */}
                    <div className={noteBox}>No saved cards found.</div>
                    <input className={input} placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
                    <input className={input} placeholder="Name on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                    <div className="flex gap-3">
                      <input className={input} placeholder="Expiry (MM/YY)" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
                      <input className={input} placeholder="CVV" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} />
                    </div>
                    <p className="text-xs text-slate-400">Use any dummy values — this is a demo. e.g. 4111 1111 1111 1111.</p>
                  </div>
                )}

                {/* gap: UPI + everything else is buried behind this small link */}
                {!showMore ? (
                  <button onClick={() => setShowMore(true)} className="mt-4 text-sm font-medium text-slate-500 underline">
                    More payment options
                  </button>
                ) : (
                  <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
                    {MORE_METHODS.map((m) => (
                      <label key={m.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50">
                        <input type="radio" name="m" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-violet-600" />
                        <span className="text-lg">{m.icon}</span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                          <span className="block text-xs text-slate-500">{m.sub}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {payErr && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{payErr}</div>}

                <button onClick={pay} disabled={items.length === 0} className="mt-4 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
                  Pay ₹{total.toLocaleString("en-IN")}
                </button>
                <div className="mt-3 text-center text-xs text-slate-400">🔒 256-bit encrypted · PCI-DSS compliant</div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
            <div className="font-bold text-slate-900">Order summary</div>
            <div className="mt-3 space-y-2">
              {items.length === 0 && <div className="text-sm text-slate-500">Your cart is empty. <Link href="/novabrand/products" className="text-violet-600">Add something</Link>.</div>}
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{i.name} × {i.qty}</span>
                  <span className="text-slate-900">₹{(i.price * i.qty).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
              {discount > 0 && <div className="mt-1 flex justify-between text-emerald-700"><span>Discount ({coupon})</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>}
              <div className="mt-1 flex justify-between text-slate-600"><span>Shipping</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold text-slate-900"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
