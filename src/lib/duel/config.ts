// Client-safe config: must NOT import the Anthropic SDK (which pulls node:fs
// into the browser bundle). Model names are read straight from env here.

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? DEFAULT_MODEL;
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? DEFAULT_MODEL;
export const VARIATOR_MODEL = process.env.DUEL_VARIATOR_MODEL ?? DEFAULT_MODEL;

/** Soft max turns — buyer wraps up naturally after this. */
export const SOFT_MAX_TURNS = 20;
/** Impatience increase when player is silent > 90s. */
export const SILENCE_IMPATIENCE = 0.15;
/** Turns in one stage before impatience ticks up. */
export const STAGE_STALL_THRESHOLD = 6;
/** Impatience per turn past the stall threshold. */
export const STALL_IMPATIENCE = 0.08;

export const RAHUL_MENTION = "@Rahul Kothari";
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";

/** The delimiter the buyer prompt uses to separate conversation from metadata. */
export const META_DELIMITER = "---AXIOM_META---";
