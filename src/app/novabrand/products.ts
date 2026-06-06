// NovaBrand catalogue — a D2C lifestyle/tech brand.
export interface NbProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  color: string;
  tagline: string;
  bestseller?: boolean;
}

export const NB_PRODUCTS: NbProduct[] = [
  { id: "nb-aura-01", name: "Aurora Wireless Earbuds", category: "Audio", price: 3499, mrp: 5499, color: "#6d28d9", tagline: "40-hour playback. ANC that actually silences the metro.", bestseller: true },
  { id: "nb-pulse-02", name: "Pulse Smartwatch", category: "Wearables", price: 4999, mrp: 7999, color: "#0891b2", tagline: "AMOLED display, 7-day battery, 100+ sport modes.", bestseller: true },
  { id: "nb-glow-03", name: "Glow Vitamin C Serum", category: "Skincare", price: 699, mrp: 1099, color: "#db2777", tagline: "10% Vitamin C. Visibly brighter skin in two weeks.", bestseller: true },
  { id: "nb-hydra-04", name: "Hydra Smart Bottle", category: "Lifestyle", price: 1299, mrp: 1999, color: "#0ea5e9", tagline: "Glows to remind you to sip. Cold for 24 hours." },
  { id: "nb-drift-05", name: "Drift Travel Backpack", category: "Bags", price: 2499, mrp: 3999, color: "#ca8a04", tagline: "20L, laptop-safe, monsoon-proof. Made for the commute." },
  { id: "nb-lumen-06", name: "Lumen Desk Light", category: "Home", price: 1799, mrp: 2599, color: "#e11d48", tagline: "Warm-to-cool dimming, flicker-free, eye-care certified." },
];

export const NB_BESTSELLERS = NB_PRODUCTS.filter((p) => p.bestseller);
