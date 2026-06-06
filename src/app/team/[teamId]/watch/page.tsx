"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useGameState, useCountdown, fmtTime } from "@/lib/useGameState";
import { COMPANIES } from "@/lib/content/companies";
import { CUSTOMERS } from "@/lib/content/customers";
import { BriefTabs } from "@/components/BriefTabs";
import { StageNumber } from "@/lib/types";

const STAGE_NAME: Record<number, string> = { 1: "PAYMENT", 2: "PRODUCT", 3: "TECH", 4: "FINANCE", 5: "FINAL" };

// Linkify any store path / URL a DM mentions so spectators can open it too.
const LINK_RE = /(https?:\/\/[^\s)]+|\/novabrand(?:\/[a-zA-Z]*)?|\/checkout)/g;
function linkify(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const url = m[0];
    out.push(
      <a key={`${m.index}-${url}`} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#7db4ff", textDecoration: "underline", fontWeight: 700 }}>
        {url}
      </a>,
    );
    last = m.index + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// READ-ONLY spectator view. The rest of a team watches the live conversation
// here while one teammate drives the master terminal. No input — just follow.
export default function WatchPage() {
  const params = useParams<{ teamId: string }>();
  const { state } = useGameState();
  const remaining = useCountdown(state);

  const rawParam = String(params.teamId ?? "").toLowerCase();
  const teamId = useMemo(() => {
    if (!state) return rawParam;
    if (state.teams[rawParam]) return rawParam;
    const match = Object.values(state.teams).find((t) => t.company && t.company.toLowerCase() === rawParam);
    return match?.id ?? rawParam;
  }, [state, rawParam]);

  const team = state?.teams[teamId];
  const company = team?.company ? COMPANIES[team.company] : null;
  const customer = state?.customer ? CUSTOMERS[state.customer] : null;
  const stage = (state?.stage ?? 1) as StageNumber;
  const phase = state?.stagePhase ?? "questions";
  const messages = useMemo(
    () => (team ? team.conversationHistory.filter((m) => m.stage === stage) : []),
    [team, stage],
  );

  // Watch-link gate: a team can only watch its OWN conversation. The members'
  // link carries ?w=<watchToken>; we persist it so refresh/bare-URL keeps
  // access. Without a matching token → blocked. Legacy games (no watchToken)
  // stay open.
  const [watchOk, setWatchOk] = useState(true);
  const [watchChecked, setWatchChecked] = useState(false);
  useEffect(() => {
    if (!team) return;
    const required = team.watchToken;
    if (!required) { setWatchOk(true); setWatchChecked(true); return; }
    let tok: string | null = null;
    const lsKey = `deal:w:${team.id}`;
    try {
      const w = new URLSearchParams(window.location.search).get("w");
      if (w) {
        tok = w;
        if (w === required) { try { localStorage.setItem(lsKey, w); } catch { /* noop */ } }
      } else {
        try { tok = localStorage.getItem(lsKey); } catch { /* noop */ }
      }
    } catch { /* noop */ }
    setWatchOk(tok === required);
    setWatchChecked(true);
  }, [team?.id, team?.watchToken]);

  // Auto-scroll to the newest message as the conversation streams in.
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!state) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="font-mono-display" style={{ color: "#8888aa" }}>connecting…</div>
      </main>
    );
  }
  if (!team) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="font-mono-display text-center" style={{ color: "#8888aa" }}>
          <div className="text-xl mb-1" style={{ color: "#ff6b6b" }}>team not found</div>
          <div className="text-sm">check the link — try /team/&lt;company&gt; or /team/1–6</div>
        </div>
      </main>
    );
  }

  // Wrong/missing watch token → this isn't your team's watch link.
  if (watchChecked && team.watchToken && !watchOk) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: "#0a0a0f" }}>
        <div
          className="rounded p-6 text-center font-mono-display max-w-md w-full"
          style={{ background: "#12121a", border: "1px solid #ff6b6b" }}
        >
          <div className="text-2xl mb-2" style={{ color: "#ff6b6b" }}>🔒 NOT YOUR TEAM&apos;S VIEW</div>
          <div className="text-sm" style={{ color: "#c7c7d6" }}>
            This watch link is private to {company?.name ?? "another team"}. Use your own team&apos;s watch link — ask your captain or the facilitator for it.
          </div>
        </div>
      </main>
    );
  }

  const lowTime = remaining > 0 && remaining < 60;
  const overtime = state.status === "stage-active" && remaining <= 0;
  const live = state.status === "stage-active";

  return (
    <main className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 md:p-6" style={{ background: "#0a0a0f" }}>
      <header className="rounded p-4 mb-4" style={{ background: "#12121a", border: "1px solid #2a2a3a" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono-display" style={{ color: "#8888aa", fontSize: 11 }}>
              👁 SPECTATOR · READ-ONLY · TEAM {team.id}
            </div>
            <div className="font-mono-display text-xl mt-1" style={{ color: "#e8e8f0" }}>
              {company?.name ?? team.playerName}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono-display text-xs" style={{ color: live ? (phase === "pitch" ? "#ffaa00" : "#00f5a0") : "#5a6a88" }}>
              {live ? `ROUND ${stage} · ${STAGE_NAME[stage]} · ${phase === "pitch" ? "PITCH" : "QUESTIONS"}` : state.status.toUpperCase()}
            </div>
            {live && (
              <div className={`font-mono-display text-2xl ${lowTime || overtime ? "pulse-timer" : ""}`} style={{ color: lowTime || overtime ? "#ff3d3d" : "#00f5a0" }}>
                {fmtTime(remaining)}
              </div>
            )}
          </div>
        </div>
        {team.eliminated && (
          <div className="font-mono-display text-xs mt-2" style={{ color: "#ff6b6b" }}>
            ✗ eliminated at round {team.eliminatedAtStage}
          </div>
        )}
      </header>

      <div className="rounded px-3 py-2 mb-3 text-xs font-mono-display" style={{ background: "#101a14", border: "1px solid #1f3a2a", color: "#8be9b0" }}>
        Watching live — your teammate is driving. This view follows the conversation; it can&apos;t send.
      </div>

      {/* Same brief the captain has — so the whole team can study it together */}
      <BriefTabs ownCompany={team.company} company={company} customer={customer} />

      <section className="flex-1 rounded p-3" style={{ background: "#0c0c12", border: "1px solid #1d1d2a" }}>
        {messages.length === 0 ? (
          <div className="font-mono-display text-sm text-center py-10" style={{ color: "#5a5a6a" }}>
            {live ? "waiting for the first question…" : "no conversation yet — stand by for the round to start."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => {
              const isTeam = m.role === "team";
              return (
                <div key={i} className={`flex flex-col ${isTeam ? "items-end" : "items-start"}`}>
                  <div className="text-xs font-mono-display mb-1" style={{ color: "#555" }}>
                    {isTeam ? "YOUR TEAM" : (m.speakerName ?? "CUSTOMER")}
                  </div>
                  <div
                    className="rounded px-3 py-2 text-sm font-mono-display max-w-[85%]"
                    style={{
                      background: isTeam ? "#1a2a1a" : "#1a1a2a",
                      border: `1px solid ${isTeam ? "#2a4a2a" : "#2a2a4a"}`,
                      color: "#e8e8f0",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {isTeam ? m.content : linkify(m.content)}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </section>

      {phase === "pitch" && team.stageSubmissions?.[stage] && (
        <section className="rounded p-4 mt-4" style={{ background: "#12121a", border: "1px solid #ffaa00" }}>
          <div className="font-mono-display text-xs mb-2 tracking-widest" style={{ color: "#ffaa00" }}>// YOUR TEAM&apos;S SUBMITTED PITCH</div>
          <p className="text-sm font-mono-display" style={{ color: "#e8e8f0", whiteSpace: "pre-wrap" }}>{team.stageSubmissions[stage]}</p>
        </section>
      )}
    </main>
  );
}
