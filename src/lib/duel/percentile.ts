/**
 * Percentile = share of players this score beat.
 * rankBelow = how many existing players scored strictly lower.
 * total = total players including this one.
 * Special case: the very first player (total <= 1) is seeded to 50 so the
 * day-one scorecard never reads "better than 100% of players".
 */
export function percentileFromRank(rankBelow: number, total: number): number {
  if (total <= 1) return 50;
  const pct = (rankBelow / (total - 1)) * 100;
  return Math.max(0, Math.min(99, Math.round(pct)));
}
