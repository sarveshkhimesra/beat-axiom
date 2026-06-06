import { ReactNode } from "react";
import { CartProvider } from "./CartContext";
import { Nav } from "./Nav";

export const metadata = {
  title: "NovaBrand — everyday tech, beautifully done",
  description:
    "Shop earbuds, smartwatches, skincare and lifestyle essentials at NovaBrand — India's fastest-growing D2C brand.",
};

// Standalone storefront shell (its own light theme), independent of the game UI.
export default function NovaBrandLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Nav />
        <main>{children}</main>
        <footer className="mt-20 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-bold text-slate-700">
              Nova<span className="text-violet-600">Brand</span>
            </span>
            <span>© 2026 NovaBrand Commerce Pvt. Ltd. · A demo storefront for The Deal sales game.</span>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
