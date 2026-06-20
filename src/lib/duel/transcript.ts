/**
 * Pure transcript-assembly logic for the speech-to-text hook.
 *
 * Extracted from useSpeech so the dedup/append rules are unit-testable without
 * a DOM or the Web Speech API. The runaway-duplication bug ("...quickhi I want
 * to have a quickhi I want to have a quick discussionhi...") lived entirely in
 * this assembly logic, so this is exactly where regression coverage belongs.
 *
 * Invariant: speech is always assembled from an IMMUTABLE base snapshot — the
 * text that existed before the speaking session began. The live output is never
 * fed back in as the base, which is what caused the duplication.
 */

/** Append `spoken` after `base` with exactly one separating space when needed. */
export function joinSpoken(base: string, spoken: string): string {
  const s = spoken.trim();
  if (!s) return base;
  if (!base) return s;
  return base.endsWith(" ") ? base + s : base + " " + s;
}

export interface ResultSegment {
  transcript: string;
  isFinal: boolean;
}

/**
 * Split one recognition instance's `results` (which in continuous mode hold
 * every segment from index 0) into its finalized and interim parts.
 */
export function combineSegments(segments: ResultSegment[]): {
  finalized: string;
  interim: string;
} {
  let finalized = "";
  let interim = "";
  for (const seg of segments) {
    if (seg.isFinal) finalized = joinSpoken(finalized, seg.transcript);
    else interim = joinSpoken(interim, seg.transcript);
  }
  return { finalized, interim };
}

/**
 * The full live text to display while capturing.
 *
 * @param base             immutable snapshot of text before this session
 * @param sessionFinalized text finalized in earlier (auto-restarted) instances
 * @param instanceFinal    text finalized by the current instance so far
 * @param interim          current interim (not-yet-final) preview
 */
export function liveText(
  base: string,
  sessionFinalized: string,
  instanceFinal: string,
  interim: string
): string {
  const fullFinal = joinSpoken(sessionFinalized, instanceFinal);
  return joinSpoken(base, joinSpoken(fullFinal, interim));
}

/** The clean committed text (no interim artifacts) for a finished instance. */
export function committedText(
  base: string,
  sessionFinalized: string,
  instanceFinal: string
): string {
  return joinSpoken(base, joinSpoken(sessionFinalized, instanceFinal));
}
