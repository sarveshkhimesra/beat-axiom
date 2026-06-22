// Client-safe config: must NOT import the Anthropic SDK (which pulls node:fs
// into the browser bundle). Model names are read straight from env here.

/** Max player turns per duel — bounds API cost per session. */
export const MAX_PLAYER_TURNS = 7;
/** Max characters per player message (no limit — players speak/type freely). */
export const MAX_MESSAGE_CHARS = Infinity;
/** Total duel duration in seconds (10 minutes). */
export const DUEL_DURATION_SECONDS = 600;
/** Seconds remaining when the timer warning fires. */
export const DUEL_WARNING_SECONDS = 30;
/** Consecutive vague questions before AXIOM ends the meeting. */
export const VAGUE_QUESTION_LIMIT = 3;
/** Rahul's handle text for share copy (LinkedIn uses name, Twitter uses handle). */
export const RAHUL_MENTION_LINKEDIN = "@Rahul Kothari";
export const RAHUL_MENTION_TWITTER = "@rahul_kothari";
