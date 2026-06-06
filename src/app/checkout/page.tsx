import { redirect } from "next/navigation";

// The checkout secret now lives in the full NovaBrand storefront. Keep the old
// /checkout link working by sending it to the store entry.
export default function CheckoutRedirect() {
  redirect("/novabrand");
}
