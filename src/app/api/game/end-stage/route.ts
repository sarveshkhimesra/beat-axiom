import { NextResponse } from "next/server";
import { mutateGameState, getGameState, setGameState, pushConsole } from "@/lib/redis";
import { broadcast } from "@/lib/pusher";
import { evaluateStage, generatePrepBrief } from "@/lib/axiom";
import { StageNumber } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    // 1. Transition to evaluating.
    let state = await mutateGameState((s) => {
      s.status = "stage-evaluating";
      s.pausedAt = null;
      pushConsole(s, `curl -sXPOST $DEAL/api/round/${s.stage}/end`, "202 · transcripts queued · AXIOM scoring the room …");
      return s;
    });
    await broadcast("game:stage-evaluating", { stage: state.stage });

    // 2. Call AXIOM (long-running, ~10-30s).
    const evaluation = await evaluateStage(state, state.stage as StageNumber);

    // 3. Persist evaluation + apply elimination + update per-team rollups.
    state = await mutateGameState((s) => {
      s.stageEvaluations[s.stage] = evaluation;
      s.status = "stage-reveal";

      for (const teamId of Object.keys(evaluation.scores)) {
        const score = evaluation.scores[teamId];
        const team = s.teams[teamId];
        if (!team) continue;
        team.currentScore = team.currentScore + score.totalScore;
        team.temperatureGauge = score.temperatureGauge;
        team.secretPriorityProgress = Math.max(
          team.secretPriorityProgress,
          score.secretPriorityProgress,
        );
        if (evaluation.stage === 1 && score.earnedStage2Access === true) {
          team.earnedStage2Access = true;
        }
      }

      // ELIMINATION IS MANUAL. AXIOM only SCORES the room — it never auto-cuts.
      // The facilitator decides who (if anyone) goes, via /api/game/eliminate,
      // after looking at the board AND walking the tables for AI use. Neutralize
      // AXIOM's suggested cut + any tiebreak flag so no UI implies an auto-result.
      evaluation.eliminatedTeamId = null;
      evaluation.tiebreakRequired = false;

      pushConsole(
        s,
        `axiom eval --round ${s.stage} --emit verdict`,
        "verdict committed · scores in · facilitator decides cuts ✓",
      );
      return s;
    });

    broadcast("game:stage-end", { stage: state.stage }).catch((err) =>
      console.error("[end-stage] broadcast failed", err),
    );

    // 4. After Round 4, generate a prep brief for each SURVIVING team to help
    //    them prepare the Round 5 pitch (recap of what they learned in rounds 1-4).
    if (state.stage === 4) {
      const survivors = state.teamOrder
        .map((id) => state.teams[id])
        .filter((t) => !t.eliminated && !!t.company);
      try {
        const briefs = await Promise.all(
          survivors.map((t) => generatePrepBrief(state, t).then((brief) => ({ id: t.id, brief }))),
        );
        state = await mutateGameState((s) => {
          for (const { id, brief } of briefs) {
            if (s.teams[id] && brief) s.teams[id].preFinalBrief = brief;
          }
          return s;
        });
        broadcast("game:updated", {}).catch(() => {});
      } catch (briefErr) {
        console.error("[end-stage] prep-brief error", briefErr);
      }
    }

    // 5. After Round 5 we DON'T auto-declare a winner. Elimination is the
    //    facilitator's call at every stage — including the final — so we stay in
    //    stage-reveal with the scores up. The facilitator does any last cuts
    //    (incl. AI-detection), then hits "Declare Winner" → POST /api/finalize,
    //    which runs the finale over the surviving teams.

    return NextResponse.json({ state, evaluation });
  } catch (err) {
    const e = err as { message?: string };
    console.error("[game/end-stage] error", err);
    const fallback = await getGameState();
    if (fallback && fallback.status !== "stage-reveal" && fallback.status !== "ended") {
      fallback.status = "stage-active";
      await setGameState(fallback);
      await broadcast("game:updated", {}).catch(() => {});
    }
    return NextResponse.json(
      { error: e?.message ?? "end-stage failed" },
      { status: 500 },
    );
  }
}
