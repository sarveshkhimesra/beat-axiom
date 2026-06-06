import { ProductCard } from "../ProductCard";
import { NB_PRODUCTS } from "../products";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-3xl font-extrabold text-slate-900">Shop everything</h1>
      <p className="mt-2 text-slate-600">Audio, wearables, skincare, home — the full NovaBrand range.</p>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {NB_PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
