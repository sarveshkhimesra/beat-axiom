import { ANTHROPIC_MODEL } from "@/lib/anthropic";

/** Cheap/fast model for the many buyer turns. */
export const AVATAR_MODEL = process.env.DUEL_AVATAR_MODEL ?? ANTHROPIC_MODEL;
/** Stronger model for the single AXIOM verdict call. */
export const VERDICT_MODEL = process.env.DUEL_VERDICT_MODEL ?? ANTHROPIC_MODEL;

/** Max player turns per duel — bounds API cost per session. */
export const MAX_PLAYER_TURNS = 7;
/** Max characters per player message. */
export const MAX_MESSAGE_CHARS = 300;
/** Rahul's LinkedIn handle text, pre-typed into share copy. */
export const RAHUL_MENTION = "@Rahul Kothari";
/** Kill switch: when "true", the duel is paused. */
export const DUEL_PAUSED = process.env.DUEL_PAUSED === "true";
