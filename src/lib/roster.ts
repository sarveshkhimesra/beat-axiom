import { CUSTOMERS, findDm } from "./content/customers";
import {
  CustomerDecisionMaker,
  GameState,
  StageNumber,
  TeamState,
} from "./types";

export interface RosterEntry {
  id: string;
  role: string;
  name: string;
}

/**
 * Returns the resolved list of DMs in the room for a given team at the current stage.
 * For pickN stages (stage 2), uses the persisted team.stageRosters[stage] if set.
 * Throws if customer not selected or roster missing for a pickN stage that should have been rolled.
 */
export function getRoom(
  state: GameState,
  team: TeamState,
  stage: StageNumber,
): CustomerDecisionMaker[] {
  if (!state.customer) return [];
  const customer = CUSTOMERS[state.customer];
  const roster = customer.meetingRosters[stage];
  if (!roster) return [];

  if (roster.kind === "fixed") {
    return roster.dmIds
      .map((id) => findDm(customer, id))
      .filter((d): d is CustomerDecisionMaker => !!d);
  }
  // pickN — read persisted selection from team state
  const picked = team.stageRosters[stage] ?? [];
  return picked
    .map((id) => findDm(customer, id))
    .filter((d): d is CustomerDecisionMaker => !!d);
}

/**
 * Roll the dice for a pickN stage. Returns selected DM ids.
 * Deterministic-per-call (no seed) — caller persists.
 */
export function rollPickN(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Ensure every team has a roster locked for the given stage (rolls if pickN, no-op if fixed).
 * Mutates the state in place.
 */
export function ensureRostersForStage(state: GameState, stage: StageNumber): void {
  if (!state.customer) return;
  const customer = CUSTOMERS[state.customer];
  const roster = customer.meetingRosters[stage];
  if (!roster) return;

  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId];
    if (!team || team.eliminated) continue;
    if (team.stageRosters[stage] && team.stageRosters[stage]!.length > 0) continue; // already locked
    if (roster.kind === "fixed") {
      team.stageRosters[stage] = roster.dmIds.slice();
    } else {
      team.stageRosters[stage] = rollPickN(roster.pool, roster.pickCount);
    }
  }
}
