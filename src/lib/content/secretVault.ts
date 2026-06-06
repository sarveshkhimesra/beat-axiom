// ─────────────────────────────────────────────────────────────────────────────
// THE SECRET VAULT
// Every piece of hidden / guarded game info lives (or is referenced) here, in
// one place. These are the things the customer must NOT give away easily — they
// are earned through sharp, repeated probing (see the GUARD rules in
// src/app/api/avatar-response/route.ts). Centralising them keeps secret content
// in a single source and out of freely-shared copy.
// ─────────────────────────────────────────────────────────────────────────────
import { CUSTOMERS } from "./customers";
import { GAME_SECRETS, secretForRound, type GameSecret } from "./secrets";
import {
  NOVABRAND_CHECKOUT_GAPS,
  CHECKOUT_GAPS_TEXT,
  CHECKOUT_PATH,
  CHECKOUT_GAP_POINTS,
} from "./checkout";

// Re-export the guarded assets so callers can import them from the vault.
export {
  GAME_SECRETS,
  secretForRound,
  NOVABRAND_CHECKOUT_GAPS,
  CHECKOUT_GAPS_TEXT,
  CHECKOUT_PATH,
  CHECKOUT_GAP_POINTS,
};
export type { GameSecret };

// The customer's crown-jewel priority + the topics that (only after real
// probing) unlock it. Guarded — never volunteered.
export function secretPriorityFor(customerId: keyof typeof CUSTOMERS) {
  const c = CUSTOMERS[customerId];
  return { priority: c.secretPriority, hintTopics: c.secretPriorityHintTopics };
}

// One-line rule reused wherever a persona could leak vault info.
export const SECRET_GUARD_RULE =
  "VAULT — never volunteer this. Reveal only after genuine, repeated, pointed probing on the exact area; a vague question earns a deflection, not the secret.";
