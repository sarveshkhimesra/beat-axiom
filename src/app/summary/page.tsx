"use client";

import { useEffect, useRef } from "react";
import { useGameState } from "@/lib/useGameState";
import { COMPANIES } from "@/lib/content/companies";
import { CUSTOMERS } from "@/lib/content/customers";
import { STAGE_RUBRICS } from "@/lib/scoring";
import { StageNumber } from "@/lib/types";

export default function SummaryPage() {
  const { state, loading } = useGameState();
  const hasPrintedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Auto-open the print dialog once the data is rendered so people can
    // "Save as PDF" without hunting for the button.
    // Keyed on state?.gameId (not full state) to avoid re-firing on every Pusher update.
    if (!loading && state && !hasPrintedRef.current) {
      hasPrintedRef.current = true;
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [loading, state?.gameId]);

  if (loading) return <div className="p-10 muted-text">loading…</div>;
  if (!state) return <div className="p-10 muted-text">no game</div>;

  const customer = state.customer ? CUSTOMERS[state.customer] : null;
  const finale = state.finale;
  const winner = finale?.winnerTeamId ? state.teams[finale.winnerTeamId] : null;
  const stages = [1, 2, 3, 4, 5] as const;

  return (
    <main className="summary p-8 max-w-4xl mx-auto">
      <div className="no-print mb-6 flex gap-2">
        <button className="btn" onClick={() => window.print()}>
          🖨 Print / Save as PDF
        </button>
        <a className="btn" href="/projector">
          ← Back to projector
        </a>
      </div>

      <header className="border-b pb-4 mb-6" style={{ borderColor: "var(--border)" }}>
        <div className="font-mono-display text-xs muted-text tracking-widest">// THE DEAL SALES CHAMPIONSHIP — SUMMARY</div>
        <h1 className="font-mono-display text-3xl mt-1">{customer?.name ?? "—"} engagement</h1>
        <div className="muted-text text-sm mt-1">
          Game {state.gameId} · {new Date(state.createdAt).toLocaleString()}
        </div>
      </header>

      {finale && winner && (
        <section className="mb-6">
          <h2 className="font-mono-display accent-text text-sm tracking-widest mb-2">// WINNER</h2>
          <div className="font-mono-display text-2xl">{winner.playerName}</div>
          <div className="muted-text">
            {winner.company ? COMPANIES[winner.company].name : "—"} · cumulative {winner.currentScore}
          </div>
          <p className="mt-3 italic">&ldquo;{finale.winnerJourneyLine}&rdquo;</p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-mono-display accent-text text-sm tracking-widest mb-2">// TEAMS</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="text-left p-2 muted-text font-mono-display">Team</th>
              <th className="text-left p-2 muted-text font-mono-display">Player</th>
              <th className="text-left p-2 muted-text font-mono-display">Company</th>
              <th className="text-right p-2 muted-text font-mono-display">Cumulative</th>
              <th className="text-right p-2 muted-text font-mono-display">Eliminated@</th>
            </tr>
          </thead>
          <tbody>
            {state.teamOrder
              .map((id) => state.teams[id])
              .filter((t) => !!t.company)
              .map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="p-2 font-mono-display">{t.id}</td>
                  <td className="p-2">{t.playerName}</td>
                  <td className="p-2">{t.company ? COMPANIES[t.company].name : "—"}</td>
                  <td className="p-2 text-right font-mono-display accent-text">
                    {t.currentScore}
                  </td>
                  <td className="p-2 text-right muted-text">
                    {t.eliminated ? `Stage ${t.eliminatedAtStage}` : "—"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="font-mono-display accent-text text-sm tracking-widest mb-2">
          // STAGE-BY-STAGE
        </h2>
        {stages.map((s) => {
          const ev = state.stageEvaluations[s as StageNumber];
          if (!ev) {
            return (
              <div key={s} className="muted-text text-sm mb-3">
                Stage {s}: not played
              </div>
            );
          }
          const sorted = Object.values(ev.scores).sort((a, b) => b.totalScore - a.totalScore);
          return (
            <div key={s} className="mb-5">
              <h3 className="font-mono-display text-base mb-2">
                Stage {s} — {STAGE_RUBRICS[s].title}
              </h3>
              {sorted.map((score) => {
                const t = state.teams[score.teamId];
                return (
                  <div key={score.teamId} className="text-sm mb-2 page-break-inside-avoid">
                    <div>
                      <span className="font-mono-display">
                        Team {score.teamId} · {t?.playerName}
                      </span>{" "}
                      —{" "}
                      <span className="accent-text font-mono-display">{score.totalScore}</span>
                      {ev.eliminatedTeamId === score.teamId && (
                        <span className="danger-text font-mono-display ml-2">
                          ELIMINATED
                        </span>
                      )}
                    </div>
                    <div className="muted-text italic text-xs mt-0.5">
                      &ldquo;{score.quirkySummary}&rdquo;
                    </div>
                    {score.bestQuestion && (
                      <div className="text-xs mt-1">
                        <span className="accent-text font-mono-display">BEST: </span>
                        <span className="muted-text">{score.bestQuestion}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      {finale && (
        <>
          <section className="mb-6 page-break-inside-avoid">
            <h2 className="font-mono-display accent-text text-sm tracking-widest mb-2">
              // IDEAL PLAY — WHAT GREAT WOULD HAVE LOOKED LIKE
            </h2>
            {stages.map((s) => (
              <div key={s} className="text-sm mb-2">
                <span className="font-mono-display accent-text">STAGE {s}:</span>{" "}
                <span className="muted-text">
                  {finale.idealPlay[`stage${s}` as keyof typeof finale.idealPlay]}
                </span>
              </div>
            ))}
          </section>

          <section className="mb-6 page-break-inside-avoid">
            <h2 className="font-mono-display accent-text text-sm tracking-widest mb-2">
              // GROWTH OPPORTUNITIES
            </h2>
            {Object.entries(finale.growthOpportunities).map(([teamId, line]) => {
              const t = state.teams[teamId];
              if (!t) return null;
              return (
                <div key={teamId} className="text-sm mb-2">
                  <span className="font-mono-display">
                    Team {teamId} · {t.playerName}:
                  </span>{" "}
                  <span className="muted-text">{line}</span>
                </div>
              );
            })}
          </section>
        </>
      )}

      <footer className="mt-10 pt-4 text-xs muted-text font-mono-display border-t" style={{ borderColor: "var(--border)" }}>
        AXIOM signed off on this report. Quirks and all.
      </footer>

      <style jsx global>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
          }
          .accent-text { color: #008060 !important; }
          .danger-text { color: #b00020 !important; }
          .muted-text { color: #555 !important; }
          .surface { background: white !important; }
          .no-print { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}
