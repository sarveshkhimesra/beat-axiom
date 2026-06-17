// Client-safe config: must NOT import the Anthropic SDK (which pulls node:fs
// into the browser bundle). Model names are read straight from env here.

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

/** Cheap/fast model for the many buyer turns. */
export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? DEFAULT_MODEL;
/** Stronger model for the single AXIOM verdict call. */
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? DEFAULT_MODEL;

/** Max player turns per duel — bounds API cost per session. */
export const MAX_PLAYER_TURNS = 7;
/** Max characters per player message (no limit — players speak/type freely). */
export const MAX_MESSAGE_CHARS = Infinity;
/** Rahul's LinkedIn handle text, pre-typed into share copy. */
export const RAHUL_MENTION = "@Rahul Kothari";
/** Kill switch: when "true", the duel is paused. */
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";
