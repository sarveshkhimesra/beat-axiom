"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { NbProduct } from "./products";

export interface CartLine extends NbProduct {
  qty: number;
}

interface CartCtx {
  items: CartLine[];
  add: (p: NbProduct) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  coupon: string; // applied code ("" = none)
  applyCoupon: (code: string) => void;
  discount: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "novabrand:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = (p: NbProduct) =>
    setItems((c) => {
      const found = c.find((i) => i.id === p.id);
      if (found) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { ...p, qty: 1 }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((c) => (qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i))));
  const remove = (id: string) => setItems((c) => c.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  // Applied coupon (kept in memory; survives in-app navigation via the layout).
  const [coupon, setCouponState] = useState("");
  const applyCoupon = (code: string) => setCouponState(code.trim().toUpperCase());
  const discount = useMemo(() => {
    if (coupon === "NOVA10" && subtotal >= 2500) return Math.round(subtotal * 0.1);
    if (coupon === "UPI50" && subtotal >= 999) return 50;
    return 0;
  }, [coupon, subtotal]);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, coupon, applyCoupon, discount }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
