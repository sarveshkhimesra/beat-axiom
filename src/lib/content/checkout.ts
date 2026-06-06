// NovaBrand's live storefront has deliberate checkout UX gaps. Teams who ASK
// AXIOM for the link can shop the real flow (/novabrand → cart → checkout), find
// these gaps themselves, and score big by naming them + the right fix. This is
// the Round-2 (Product) secret.
export const CHECKOUT_PATH = "/novabrand";

export interface CheckoutGap {
  gap: string;
  fix: string;
}

// Each gap a team correctly names + fixes is worth 2 points (6 gaps = 12 max).
export const CHECKOUT_GAP_POINTS = 2;

export const NOVABRAND_CHECKOUT_GAPS: CheckoutGap[] = [
  { gap: "Failed-payment dead-end — Pay leads to a 3s processing screen, then a failure with only 'Back to cart' (no retry, no alternate method)", fix: "add smart retry + automatic failover to another method/route" },
  { gap: "Card is the default, UPI is hidden — the payment page opens on the Card tab; UPI sits under a small 'More payment options' link at the bottom", fix: "put UPI first (one-tap / QR) since it's the dominant method" },
  { gap: "Re-enter card every time — 'No saved cards found' and blank fields on every visit", fix: "save/tokenise cards for returning users" },
  { gap: "Offers not auto-applied — the cart lists offers with an 'Apply' link that only fills the code; the user must still click Apply", fix: "auto-detect and apply the best eligible offer" },
  { gap: "No saved address / no pre-fill — 'No saved addresses found' and blank fields every time", fix: "save addresses + express pre-fill for returning users" },
  { gap: "Errors only after submit — the address page validates only on 'Continue', and card errors only surface when you hit 'Pay'", fix: "validate fields inline, in real time" },
];

// Compact form for prompts.
export const CHECKOUT_GAPS_TEXT = NOVABRAND_CHECKOUT_GAPS.map((g) => `${g.gap} → ${g.fix}`).join("\n");
