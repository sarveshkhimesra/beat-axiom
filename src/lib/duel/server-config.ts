import "server-only";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/** Cheap/fast model for the many buyer turns. */
export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? DEFAULT_MODEL;
/** Stronger model for the single AXIOM verdict call. */
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? DEFAULT_MODEL;
/** Kill switch: when "true", the duel is paused. */
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";
