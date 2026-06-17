/**
 * Percentile = share of players this score beat.
 * rankBelow = how many existing players scored strictly lower.
 * total = total players including this one.
 */
export function percentileFromRank(rankBelow: number, total: number): number {
  if (total <= 1) return 0; // first player — no one to beat yet
  const pct = (rankBelow / (total - 1)) * 100;
  return Math.max(0, Math.min(99, Math.round(pct)));
}
