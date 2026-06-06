"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useGameState, useCountdown, fmtTime } from "@/lib/useGameState";
import { useSpeechRecognition } from "@/lib/useSpeech";
import { COMPANIES } from "@/lib/content/companies";
import { CUSTOMERS, findDm } from "@/lib/content/customers";
import { CompanyId, CompanyProfile, CustomerProfile, StageNumber } from "@/lib/types";

// The decision-makers teams actually meet, in round order — the "who's who" for
// the static dossier. (Excludes org-chart names who never take a meeting.)
const DOSSIER_DM_ORDER: { round: number; id: string }[] = [
  { round: 1, id: "gatekeeper" },
  { round: 2, id: "vp_product" },
  { round: 3, id: "vp_tech" },
  { round: 4, id: "vp_finance" },
  { round: 5, id: "ceo" },
];

// Who you're meeting + what each round is about (plain language).
const STAGE_INTRO: Record<StageNumber, string> = {
  1: "ROUND 1 — PAYMENT. You're meeting Kavya, NovaBrand's Head of Payment Partnerships. Ask smart questions to understand their payment problems and how money decisions get made here.",
  2: "ROUND 2 — PRODUCT. You're meeting Meera (VP Product). Find out what innovation she wants, where the product is heading — and remember her team is stretched thin, so integration effort matters.",
  3: "ROUND 3 — TECH. You're meeting Ankit (CTO). Ask what he needs on stability, scale, integrations, and keeping system risk low.",
  4: "ROUND 4 — FINANCE. You're meeting Arjun (CFO). Ask what the numbers and deal structure need to look like — he likes creative commercial structures, not just a flat price.",
  5: "ROUND 5 — FINAL. You're in front of Naina (CEO) and the whole leadership team. Tie it all together: why you, why now, and where this takes NovaBrand in three years.",
};

const AVATAR_PALETTE = [
  "#7b2fff",
  "#00f5a0",
  "#ffaa00",
  "#ff8a00",
  "#ff3d8a",
  "#3da5ff",
];

function avatarColorFor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// Turn any URL or internal store path the DM mentions (e.g. "/novabrand",
// "/novabrand/checkout", or a full https URL) into a clickable link that opens
// in a new tab — so teams can go straight to the live checkout.
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
      <a
        key={`${m.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#7db4ff", textDecoration: "underline", fontWeight: 700 }}
      >
        {url}
      </a>,
    );
    last = m.index + url.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type BriefTab = "self" | "customer" | "competition" | "hidden";

// Tabbed brief: SELF (your own company) · CUSTOMER (company + decision-makers) ·
// COMPETITION (a detailed read on each rival) · HIDE (collapse for a clean screen).
function BriefTabs({
  company,
  customer,
  ownCompany,
}: {
  company: CompanyProfile | null;
  customer: CustomerProfile | null;
  ownCompany: string | null;
}) {
  const [tab, setTab] = useState<BriefTab>("self");
  const rivalIds = (Object.keys(COMPANIES) as CompanyId[]).filter((c) => c !== ownCompany);

  const tabs: { id: BriefTab; label: string }[] = [
    { id: "self", label: "SELF" },
    { id: "customer", label: "CUSTOMER" },
    { id: "competition", label: "COMPETITION" },
    { id: "hidden", label: "HIDE ✕" },
  ];

  const accent = tab === "self" ? "#00f5a0" : "#ffaa00";

  return (
    <section
      className="rounded mb-4 text-sm font-mono-display"
      style={{
        background: "#12121a",
        border: `1px solid ${tab === "hidden" ? "#2a2a3a" : accent}`,
      }}
    >
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 p-2" style={{ borderBottom: tab === "hidden" ? "none" : "1px solid #2a2a3a" }}>
        {tabs.map((t) => {
          const active = t.id === tab;
          const isHide = t.id === "hidden";
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="rounded px-3 py-1.5 text-xs tracking-widest"
              style={{
                background: active ? (isHide ? "#2a2a3a" : "#1f2a1f") : "transparent",
                color: active ? (isHide ? "#e8e8f0" : t.id === "self" ? "#00f5a0" : "#ffaa00") : "#8888aa",
                border: `1px solid ${active ? (isHide ? "#3a3a4a" : (t.id === "self" ? "#00f5a0" : "#ffaa00")) : "#2a2a3a"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab !== "hidden" && (
        <div className="p-4">
          {/* SELF — your own company, all true */}
          {tab === "self" && company && (
            <div>
              <h3 className="mb-2" style={{ color: "#00f5a0" }}>// WHO YOU ARE</h3>
              <p className="mb-3" style={{ color: "#8888aa" }}>{company.briefIdentity}</p>
              <h3 className="mb-2" style={{ color: "#00f5a0" }}>// OUR EDGE</h3>
              <ul className="mb-3 list-disc ml-5" style={{ color: "#8888aa" }}>
                {company.briefEdge.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              <h3 className="mb-2" style={{ color: "#00f5a0" }}>// OUR WEAKNESSES</h3>
              <ul className="mb-3 list-disc ml-5" style={{ color: "#8888aa" }}>
                {company.briefWeaknesses.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
              <h3 className="mb-2" style={{ color: "#00f5a0" }}>// OUR COST STRUCTURE</h3>
              <p className="mb-3" style={{ color: "#8888aa" }}>{company.briefCostStructure}</p>
              <h3 className="mb-2" style={{ color: "#00f5a0" }}>// DEAL STRENGTHS</h3>
              <ul className="list-disc ml-5" style={{ color: "#8888aa" }}>
                {company.briefDealStrengths.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* CUSTOMER — rich static dossier (true) + grapevine intel (75/25) */}
          {tab === "customer" && (
            <div>
              {customer && (
                <>
                  <h3 className="mb-2" style={{ color: "#ffaa00" }}>// THE COMPANY — {customer.name.toUpperCase()}</h3>
                  <p className="mb-2 leading-relaxed" style={{ color: "#c7c7d6" }}>{customer.profile}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      ["GMV", "₹800 Cr"],
                      ["Customers", "6M+"],
                      ["Mix", "85% online · 15% offline (80 stores → 300)"],
                      ["Backing", "VC-backed · Series B in ~8 months"],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded px-3 py-2" style={{ background: "#0f0f17", border: "1px solid #23232f" }}>
                        <div className="text-[10px] tracking-widest" style={{ color: "#5a6a88" }}>{k.toUpperCase()}</div>
                        <div className="text-xs" style={{ color: "#dfe6f2" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "#9a9ab0" }}>
                    They run a fragmented payments stack across three providers that don&apos;t talk to each other,
                    and they&apos;re looking to consolidate to one partner ahead of the raise. Plenty is in play —
                    online checkout, EMI/BNPL, the offline rollout, subscriptions, creator payouts. Which problem
                    matters most, and how much, is exactly what you&apos;re here to find out.
                  </p>

                  <h3 className="mb-2" style={{ color: "#ffaa00" }}>// THE DECISION-MAKERS (who you&apos;ll meet, round by round)</h3>
                  <div className="space-y-3 mb-4">
                    {DOSSIER_DM_ORDER.map(({ round, id }) => {
                      const dm = findDm(customer, id);
                      if (!dm) return null;
                      return (
                        <div
                          key={id}
                          className="rounded p-3"
                          style={{ background: "#0f0f17", border: "1px solid #2a2a3a" }}
                        >
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-[10px] rounded px-1.5 py-0.5" style={{ background: "#1a2740", color: "#8fb0e0" }}>ROUND {round}</span>
                            <span style={{ color: "#e8e8f0", fontWeight: 700 }}>{dm.name}</span>
                            <span className="text-xs" style={{ color: "#8fb0e0" }}>· {dm.role}</span>
                          </div>
                          {dm.personality && (
                            <p className="text-xs mt-2 leading-relaxed" style={{ color: "#c4c4d4" }}>
                              <span style={{ color: "#7a8aa8" }}>Personality — </span>{dm.personality}
                            </p>
                          )}
                          {dm.okrs && (
                            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#9fd9b8" }}>
                              <span style={{ color: "#5a8a6e" }}>What they own / are measured on (OKRs) — </span>{dm.okrs}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs mb-5 leading-relaxed" style={{ color: "#5a6a88" }}>
                    This is your map of the room — who they are, how they think, and what they&apos;re measured on.
                    The sharp specifics, the numbers, and the one thing that wins each of them — you earn those by
                    asking great questions in the meeting.
                  </p>
                </>
              )}

            </div>
          )}

          {/* COMPETITION — a detailed read on each rival you're up against */}
          {tab === "competition" && (
            <div className="space-y-4">
              <p className="text-xs mb-1 leading-relaxed" style={{ color: "#8fb0e0" }}>
                The other players chasing this deal. Know how each one will pitch — and exactly where they&apos;re soft.
              </p>
              {rivalIds.map((id) => {
                const c = COMPANIES[id];
                if (!c) return null;
                return (
                  <div key={id} className="rounded p-3" style={{ background: "#0f0f17", border: "1px solid #2a2a3a" }}>
                    <div className="flex items-baseline gap-2 flex-wrap mb-1">
                      <span style={{ color: "#e8e8f0", fontWeight: 700 }}>{c.name}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#c4c4d4" }}>
                      {c.tagline} {c.briefIdentity}
                    </p>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "#9fd9b8" }}>
                      <span style={{ color: "#5a8a6e" }}>Their edge — </span>{c.briefEdge.join("; ")}.
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#e0a0a0" }}>
                      <span style={{ color: "#8a5a5a" }}>Where they&apos;re soft — </span>{c.briefWeaknesses.join("; ")}.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const { state, refresh } = useGameState();
  const remaining = useCountdown(state);

  // The URL param can be the numeric id ("5") OR a company slug ("terratap").
  // Resolve to the real team id (state is keyed by the numeric id).
  const rawParam = String(params.teamId ?? "").toLowerCase();
  const teamId = useMemo(() => {
    if (!state) return rawParam;
    if (state.teams[rawParam]) return rawParam; // already a numeric id
    const match = Object.values(state.teams).find(
      (t) => t.company && t.company.toLowerCase() === rawParam,
    );
    return match?.id ?? rawParam;
  }, [state, rawParam]);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  // Write-access gate. Only the captain's link (…?k=<writeToken>) — or a device
  // that has already stored it — passes the token check; everyone else is
  // redirected to /watch. On top of that, a single-device lock means only the
  // FIRST captain device to claim the seat can write; other devices (even with
  // the token) are read-only until the facilitator resets the lock. Games made
  // before this feature have no writeToken, so write stays open (legacy).
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);
  const writeTokenRef = useRef<string | null>(null);
  const clientIdRef = useRef<string | null>(null);

  // Voice input (push-to-talk) — feeds the question box.
  const speech = useSpeechRecognition();
  const listening = speech.status === "listening";

  const team = state?.teams[teamId];
  const company = team?.company ? COMPANIES[team.company] : null;
  const customer = state?.customer ? CUSTOMERS[state.customer] : null;
  const stage = state?.stage as StageNumber | undefined;
  const phase = state?.stagePhase ?? "questions";
  const submittedPitch = stage ? team?.stageSubmissions?.[stage] : undefined;

  // While the mic is on, mirror the live transcript into whichever box is active:
  // the pitch box in Round 5, the question box in the conversation rounds.
  useEffect(() => {
    if (!speech.transcript) return;
    if (phase === "pitch") setPitch(speech.transcript);
    else setMessage(speech.transcript);
  }, [speech.transcript, phase]);

  // Reset the pitch box whenever the STAGE changes. Show this stage's saved
  // pitch if one exists, otherwise clear it — so an earlier stage's pitch never
  // carries over into a later stage. Also wipe any cached voice transcript so a
  // new round always starts from a blank box (no leftover previous input).
  useEffect(() => {
    setPitch(stage ? (team?.stageSubmissions?.[stage] ?? "") : "");
    setMessage("");
    speech.reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Stable per-browser device id (used for the single-device write lock).
  useEffect(() => {
    try {
      let cid = localStorage.getItem("deal:cid");
      if (!cid) {
        cid = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        localStorage.setItem("deal:cid", cid);
      }
      clientIdRef.current = cid;
    } catch {
      clientIdRef.current = `nostore-${Math.random().toString(36).slice(2)}`;
    }
  }, []);

  // Resolve the token: match the URL's ?k= (persisting it to this device) or a
  // previously-stored token against the team's writeToken.
  useEffect(() => {
    if (!team) return;
    const required = team.writeToken;
    if (!required) { writeTokenRef.current = null; setTokenValid(true); setTokenChecked(true); return; }
    let tok: string | null = null;
    const lsKey = `deal:wt:${team.id}`;
    try {
      const urlK = new URLSearchParams(window.location.search).get("k");
      if (urlK) {
        tok = urlK;
        if (urlK === required) { try { localStorage.setItem(lsKey, urlK); } catch { /* noop */ } }
      } else {
        try { tok = localStorage.getItem(lsKey); } catch { /* noop */ }
      }
    } catch { /* noop */ }
    writeTokenRef.current = tok;
    setTokenValid(tok === required);
    setTokenChecked(true);
  }, [team?.id, team?.writeToken]);

  // Claim the single write seat when it's free or already ours (idempotent, so
  // refresh/reopen on the same device keeps it). If another device holds it, we
  // don't claim — we stay read-only until the facilitator resets the lock.
  useEffect(() => {
    if (!tokenChecked || !tokenValid || !team || !team.writeToken) return;
    const cid = clientIdRef.current;
    if (!cid) return;
    if (team.writerClientId && team.writerClientId !== cid) return; // held by another device
    fetch("/api/game/claim-writer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId: team.id, token: writeTokenRef.current, clientId: cid }),
    }).then(() => refresh()).catch(() => { /* noop */ });
  }, [tokenChecked, tokenValid, team?.id, team?.writeToken, team?.writerClientId, refresh]);

  // No valid token at all → read-only view.
  useEffect(() => {
    if (tokenChecked && team && team.writeToken && !tokenValid) {
      const slug = team.company ? team.company.toLowerCase() : team.id;
      window.location.replace(`/team/${slug}/watch`);
    }
  }, [tokenChecked, tokenValid, team?.id, team?.company, team?.writeToken]);


  // Resolve who's in the room right now based on team's persisted roster for the current stage.
  const roomDms = useMemo(() => {
    if (!state || !customer || !team || !stage) return [];
    const ids = team.stageRosters[stage] ?? [];
    return ids
      .map((id) => findDm(customer, id))
      .filter((d): d is NonNullable<typeof d> => !!d);
  }, [state, customer, team, stage]);

  const lowTime = remaining > 0 && remaining < 60;
  // The clock is a GUIDE only. When it hits zero the round goes into "overtime"
  // — input stays open and responses keep being recorded. The facilitator's
  // "End Round" (which flips status away from stage-active) is the real cutoff,
  // and they can grant +2:00 at any time. So nothing in the UI hard-locks on
  // the clock.
  const overtime = state?.status === "stage-active" && remaining <= 0;
  const timeUp = false;
  // Players talk to the room — no typing — UNLESS the facilitator has enabled
  // chat (a fallback for when voice misbehaves) or the browser has no speech
  // recognition at all. In those cases we show an editable text box (with the
  // mic still available to dictate into it).
  const speechSupported = speech.status !== "unsupported";
  const chatEnabled = state?.chatEnabled ?? false;
  const voiceMode = speechSupported && !chatEnabled; // pure voice-only UI
  const showMic = speechSupported; // mic available in both modes
  const phaseLabel = phase === "pitch" ? "PITCH" : "QUESTIONS";
  const phaseColor = phase === "questions" ? "#00f5a0" : "#ffaa00";

  // Write access = valid token AND (this device holds the seat, or it's free).
  const heldByOther = !!(team?.writeToken && team.writerClientId && clientIdRef.current && team.writerClientId !== clientIdRef.current);
  const canWrite = tokenValid && !heldByOther;

  async function handleSend() {
    if (message.trim().length < 1 || sending || timeUp || !canWrite) return;
    setSending(true);
    setSendError(null);
    const text = message.trim();
    setMessage("");
    try {
      const r = await fetch("/api/avatar-response", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId, message: text, token: writeTokenRef.current, clientId: clientIdRef.current }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setSendError((j as { error?: string }).error ?? "Send failed. Try again.");
        setMessage(text);
      } else {
        speech.reset(); // wipe the captured transcript so the next turn starts clean
        await refresh();
      }
    } catch (e) {
      setSendError((e as Error).message ?? "Network error. Try again.");
      setMessage(text);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmitPitch() {
    if (pitch.trim().length < 20 || submitting || timeUp || !canWrite) return;
    setSubmitting(true);
    setPitchError(null);
    try {
      const r = await fetch("/api/game/submit-pitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ teamId, pitch: pitch.trim(), token: writeTokenRef.current, clientId: clientIdRef.current }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setPitchError((j as { error?: string }).error ?? "Submit failed. Try again.");
      } else {
        await refresh();
      }
    } catch (e) {
      setPitchError((e as Error).message ?? "Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / no state ───────────────────────────────────────────────────
  if (!state) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div className="font-mono-display text-center" style={{ color: "#8888aa" }}>
          <div className="text-3xl mb-2" style={{ color: "#00f5a0" }}>
            TEAM {teamId}
          </div>
          <div>connecting…</div>
        </div>
      </main>
    );
  }

  if (!team) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div className="font-mono-display" style={{ color: "#ff3d3d" }}>
          team {teamId} not found in current game
        </div>
      </main>
    );
  }

  // No valid captain token → bounce to the read-only view (effect handles the
  // redirect; this just avoids flashing the write UI in the meantime).
  if (tokenChecked && team.writeToken && !tokenValid) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: "#0a0a0f" }}>
        <div className="font-mono-display text-center" style={{ color: "#7db4ff" }}>
          <div className="text-lg mb-1">👁 view-only</div>
          <div className="text-xs" style={{ color: "#8888aa" }}>opening the watch view…</div>
        </div>
      </main>
    );
  }

  // Valid token but another device already holds the write seat → single-device
  // lock. Read-only here; the facilitator can reset the lock to move control.
  if (tokenChecked && team.writeToken && tokenValid && heldByOther) {
    const slug = team.company ? team.company.toLowerCase() : team.id;
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: "#0a0a0f" }}>
        <div
          className="rounded p-6 text-center font-mono-display max-w-md w-full"
          style={{ background: "#12121a", border: "1px solid #ffaa00" }}
        >
          <div className="text-2xl mb-2" style={{ color: "#ffaa00" }}>🔒 CONTROLLED ELSEWHERE</div>
          <div className="text-sm mb-4" style={{ color: "#c7c7d6" }}>
            {company?.name ?? "This team"} is already in write mode on another device — only one device per team can send.
          </div>
          <div className="text-xs mb-4" style={{ color: "#8888aa" }}>
            If you&apos;re the captain and this is the wrong device, ask the facilitator to <b>reset this team&apos;s device lock</b>, then refresh this page.
          </div>
          <a
            href={`/team/${slug}/watch${team.watchToken ? `?w=${team.watchToken}` : ""}`}
            className="font-mono-display"
            style={{ color: "#7db4ff", fontSize: 12, textDecoration: "underline" }}
          >
            👁 open the read-only view instead →
          </a>
        </div>
      </main>
    );
  }

  // ── Standby states (lobby / axiom-demo / brief) ──────────────────────────
  if (
    state.status === "lobby" ||
    state.status === "axiom-demo" ||
    state.status === "brief"
  ) {
    return (
      <main
        className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 md:p-6"
        style={{ background: "#0a0a0f" }}
      >
        <header
          className="rounded p-4 mb-4"
          style={{ background: "#12121a", border: "1px solid #2a2a3a" }}
        >
          <div className="font-mono-display" style={{ color: "#8888aa", fontSize: 11 }}>
            TEAM {teamId}
          </div>
          <div className="font-mono-display text-xl mt-1" style={{ color: "#e8e8f0" }}>
            {company?.name ?? "—"}
            {company?.tagline && (
              <span className="ml-2" style={{ color: "#8888aa", fontSize: 12 }}>
                {company.tagline}
              </span>
            )}
          </div>
          <a
            href={`/team/${team.company ? team.company.toLowerCase() : teamId}/watch${team.watchToken ? `?w=${team.watchToken}` : ""}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono-display inline-block mt-2"
            style={{ color: "#7db4ff", fontSize: 11, textDecoration: "underline" }}
          >
            👁 read-only view for the rest of your team →
          </a>
        </header>

        <div
          className="rounded p-6 text-center font-mono-display"
          style={{ background: "#12121a", border: "1px solid #2a2a3a" }}
        >
          <div className="text-2xl mb-2" style={{ color: "#00f5a0" }}>
            STANDBY
          </div>
          <div style={{ color: "#8888aa" }}>
            {state.status === "lobby" && "Waiting for the facilitator to start…"}
            {state.status === "axiom-demo" && "AXIOM demo in progress. Watch the main screen."}
            {state.status === "brief" && "Study your company brief. Stage starts soon."}
          </div>
          {customer && (
            <div className="mt-3" style={{ color: "#8888aa", fontSize: 11 }}>
              // customer: {customer.name}
            </div>
          )}
        </div>

        {state.status === "brief" && (
          <div className="mt-4">
            <BriefTabs ownCompany={team.company} company={company} customer={customer} />
          </div>
        )}
      </main>
    );
  }

  // ── Eliminated ───────────────────────────────────────────────────────────
  if (team.eliminated) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div
          className="rounded p-6 text-center font-mono-display max-w-lg w-full"
          style={{ background: "#12121a", border: `2px solid #ff3d3d` }}
        >
          <div className="text-2xl tracking-widest mb-2" style={{ color: "#ff3d3d" }}>
            ✗ ELIMINATED — ROUND {team.eliminatedAtStage}
          </div>
          {/* Just the reason — no score / verdict re-shown. */}
          {team.eliminatedReason === "ai" ? (
            <div className="mt-1 text-sm leading-relaxed" style={{ color: "#ffaa00" }}>
              ⚠ Flagged for <b>AI-assisted play</b>. AXIOM has removed your team from The Deal.
            </div>
          ) : (
            <div className="mt-1 text-sm leading-relaxed" style={{ color: "#8888aa" }}>
              Your team didn&apos;t make the cut. Thanks for playing — watch the big screen for the rest of The Deal.
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Evaluating ───────────────────────────────────────────────────────────
  if (state.status === "stage-evaluating") {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div
          className="rounded p-6 text-center font-mono-display max-w-lg w-full"
          style={{ background: "#12121a", border: `1px solid #2a2a3a` }}
        >
          <div className="text-2xl mb-2 pulse-timer" style={{ color: "#ffaa00" }}>
            ⏳ AXIOM IS EVALUATING…
          </div>
          <div style={{ color: "#8888aa", fontSize: 13 }}>
            Stand by. Results appearing on the main screen.
          </div>
        </div>
      </main>
    );
  }

  // ── Reveal / Ended ───────────────────────────────────────────────────────
  if (state.status === "stage-reveal" || state.status === "ended") {
    const lastEval = (() => {
      for (let s = (state.stage as number); s >= 1; s--) {
        const ev = state.stageEvaluations[s as StageNumber];
        if (ev && ev.scores[teamId]) return ev.scores[teamId];
      }
      return null;
    })();

    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div
          className="rounded p-6 text-center font-mono-display max-w-lg w-full"
          style={{ background: "#12121a", border: `1px solid #2a2a3a` }}
        >
          <div className="text-xs mb-2" style={{ color: "#8888aa" }}>
            STAGE {state.stage} RESULT
          </div>
          {lastEval ? (
            <>
              <div className="text-4xl mb-1" style={{ color: "#00f5a0" }}>
                {lastEval.totalScore}
              </div>
              <div className="text-sm mb-3" style={{ color: "#8888aa" }}>
                points · total: {team.currentScore}
              </div>
              {lastEval.quirkySummary && (
                <div
                  className="text-sm rounded p-3"
                  style={{
                    background: "#0a0a0f",
                    border: "1px solid #2a2a3a",
                    color: "#e8e8f0",
                  }}
                >
                  {lastEval.quirkySummary}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#8888aa" }}>Watch the main screen for results.</div>
          )}
        </div>
      </main>
    );
  }

  // ── Stage Active ─────────────────────────────────────────────────────────
  if (state.status !== "stage-active" || !stage) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-8"
        style={{ background: "#0a0a0f" }}
      >
        <div className="font-mono-display" style={{ color: "#8888aa" }}>
          connecting…
        </div>
      </main>
    );
  }

  const stageIntro = STAGE_INTRO[stage];
  const stageMessages = team.conversationHistory.filter((m) => m.stage === stage);

  return (
    <main
      className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 md:p-6"
      style={{ background: "#0a0a0f" }}
    >
      {/* Top bar */}
      <header
        className="rounded p-3 mb-4 flex items-center justify-between"
        style={{ background: "#12121a", border: "1px solid #2a2a3a" }}
      >
        <div>
          <div
            className="font-mono-display text-lg"
            style={{ color: "#e8e8f0" }}
          >
            {company?.name ?? "—"}
            {company?.tagline && (
              <span
                className="ml-2"
                style={{ color: "#8888aa", fontSize: 11 }}
              >
                {company.tagline}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-mono-display text-xs mb-1"
            style={{ color: phaseColor }}
          >
            STAGE {stage} · {phaseLabel}
          </div>
          <div
            className={`font-mono-display text-2xl ${lowTime || overtime ? "pulse-timer" : ""}`}
            style={{ color: lowTime || overtime ? "#ff3d3d" : "#00f5a0" }}
          >
            {fmtTime(remaining)}
          </div>
          {overtime && (
            <div className="font-mono-display text-xs mt-1" style={{ color: "#ffaa00" }}>
              ▸ overtime — keep going till the facilitator ends the round
            </div>
          )}
        </div>
      </header>

      {/* Stage intro / what to do now */}
      <section
        className="rounded p-4 mb-4 font-mono-display text-sm"
        style={{ background: "#12121a", border: `1px solid ${phase === "questions" ? "#2a2a3a" : "#ffaa00"}` }}
      >
        <div className="text-xs mb-2" style={{ color: phase === "questions" ? "#8888aa" : "#ffaa00" }}>
          {phase === "pitch"
            ? "// PITCH TIME — WRITE YOUR PITCH"
            : "// ASK QUESTIONS — LEARN ABOUT NOVABRAND"}
        </div>
        <p style={{ color: "#e8e8f0" }}>
          {phase === "pitch"
            ? "Questions are closed. Use what you learned to write one pitch and submit it before time runs out."
            : stageIntro}
        </p>
      </section>

      {/* Who's in the room */}
      {roomDms.length > 0 && (
        <section
          className="rounded p-3 mb-4"
          style={{ background: "#12121a", border: "1px solid #2a2a3a" }}
        >
          <div
            className="font-mono-display text-xs mb-3 tracking-widest"
            style={{ color: "#8888aa" }}
          >
            // WHO&apos;S IN THE ROOM
          </div>
          <div className="flex flex-wrap gap-3">
            {roomDms.map((d) => {
              const initials = d.name
                .split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("");
              return (
                <div
                  key={d.id}
                  className="flex items-start gap-2 rounded px-3 py-2"
                  style={{
                    border: "1px solid #2a2a3a",
                    background: "#0a0a0f",
                    flex: "1 1 calc(50% - 0.75rem)",
                    minWidth: 200,
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full text-xs font-mono-display flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      background: avatarColorFor(d.id),
                      color: "#0a0a0f",
                      marginTop: 2,
                    }}
                  >
                    {initials}
                  </span>
                  <span className="font-mono-display text-xs leading-tight">
                    <div style={{ color: "#e8e8f0" }}>{d.name}</div>
                    <div style={{ color: "#8888aa", fontSize: 10 }}>{d.role}</div>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tabbed briefs: Self · Customer · Competition · Hide */}
      <BriefTabs ownCompany={team.company} company={company} customer={customer} />

      {/* Chat history — conversation rounds only (1-4). Round 5 is pitch-only. */}
      {phase === "questions" && (
      <section
        className="rounded p-4 mb-4 flex flex-col gap-3"
        style={{ background: "#12121a", border: "1px solid #2a2a3a", minHeight: "10rem" }}
      >
        <div className="font-mono-display text-xs tracking-widest mb-1" style={{ color: "#8888aa" }}>
          // CONVERSATION
        </div>
        {stageMessages.length === 0 && (
          <div className="font-mono-display text-xs italic" style={{ color: "#555" }}>
            No messages yet. Start the conversation.
          </div>
        )}
        {stageMessages.map((m, i) => {
          const isTeam = m.role === "team";
          return (
            <div key={i} className={`flex flex-col ${isTeam ? "items-end" : "items-start"}`}>
              <div
                className="text-xs font-mono-display mb-1"
                style={{ color: "#555" }}
              >
                {isTeam ? "YOU" : (m.speakerName ?? "CUSTOMER")}
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
      </section>
      )}

      {/* QUESTIONS PHASE — voice-only (no typing). Talk to the room. */}
      {phase === "questions" && (
        <section
          className="rounded p-4"
          style={{ background: "#12121a", border: "1px solid #2a2a3a" }}
        >
          {voiceMode ? (
            <>
              <div
                className="rounded px-3 py-2 mb-3 text-xs font-mono-display"
                style={{ background: "#101a14", border: "1px solid #00f5a0", color: "#8be9b0" }}
              >
                🎤 <b>This is a spoken meeting.</b> Tap SPEAK, ask your question out loud, tap STOP — then ASK to send. No typing, no copy-paste: it&apos;s a real conversation.
              </div>
              {/* Read-only captured transcript — you can re-record, but not edit/paste.
                  No length cap: speak as long as you like; it scrolls. */}
              <div
                className="rounded p-3 text-sm font-mono-display"
                style={{
                  background: "#0a0a0f",
                  border: `1px solid ${listening ? "#ff3d8a" : "#2a2a3a"}`,
                  color: message ? "#e8e8f0" : "#5a5a6a",
                  minHeight: "5rem",
                  maxHeight: "45vh",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {message || (listening ? "listening…" : `Tap SPEAK and ask ${roomDms[0]?.name ?? "the room"} a question.`)}
              </div>
              <div className="flex justify-between items-center mt-2" style={{ color: "#8888aa" }}>
                <div className="font-mono-display text-xs">
                  {listening ? (
                    <span style={{ color: "#ff3d8a" }}>● listening… speak now</span>
                  ) : speech.status === "denied" ? (
                    <span style={{ color: "#ff3d3d" }}>mic blocked — allow microphone access in your browser</span>
                  ) : overtime ? (
                    <span style={{ color: "#ffaa00" }}>⏱ overtime — keep going</span>
                  ) : sendError ? (
                    <span style={{ color: "#ff3d3d" }}>{sendError}</span>
                  ) : (
                    <span>voice-only · speak to the room</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary font-mono-display text-sm"
                    disabled={sending}
                    onClick={() => { if (listening) { speech.stop(); } else { speech.start(message); } }}
                    title="Tap to talk — tap again to add more"
                    style={{
                      opacity: sending ? 0.4 : 1,
                      background: listening ? "#ff3d8a" : "#00f5a0",
                      color: "#0a0a0f",
                    }}
                  >
                    {listening ? "● STOP" : message ? "🎤 ADD MORE" : "🎤 SPEAK"}
                  </button>
                  {message && !listening && (
                    <button
                      className="btn font-mono-display text-sm"
                      onClick={() => { setMessage(""); speech.reset(); }}
                      title="Clear and start over"
                    >
                      ✕ CLEAR
                    </button>
                  )}
                  <button
                    className="btn font-mono-display text-sm"
                    disabled={message.trim().length < 1 || sending || listening}
                    onClick={() => handleSend()}
                    style={message.trim().length < 1 || sending || listening ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  >
                    {sending ? "…" : "ASK ▸"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Chat mode (facilitator-enabled) or no speech support — type, and
               dictate into the box with the mic if speech is available. */
            <>
              <div
                className="rounded px-3 py-2 mb-3 text-xs font-mono-display"
                style={{ background: "#101a14", border: "1px solid #2a4a2a", color: "#8be9b0" }}
              >
                {showMic ? "⌨️ Type your question — or tap 🎤 SPEAK to dictate. Paste is disabled — use your own words." : "Voice isn't supported — type your question (paste is disabled — use your own words)."}
              </div>
              <textarea
                className="w-full rounded p-3 text-sm font-mono-display resize-none"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", color: "#e8e8f0", outline: "none", height: "6rem" }}
                placeholder="Type your question…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <div className="flex justify-end gap-2 mt-2">
                {showMic && (
                  <button
                    className="btn font-mono-display text-sm"
                    onClick={() => { if (listening) { speech.stop(); } else { speech.start(message); } }}
                    style={{ background: listening ? "#ff3d8a" : "#00f5a0", color: "#0a0a0f" }}
                  >
                    {listening ? "● STOP" : message ? "🎤 ADD MORE" : "🎤 SPEAK"}
                  </button>
                )}
                <button
                  className="btn font-mono-display text-sm"
                  disabled={message.trim().length < 1 || sending}
                  onClick={() => { if (listening) speech.stop(); handleSend(); }}
                  style={message.trim().length < 1 || sending ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >
                  {sending ? "…" : "ASK ▸"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* FINAL ROUND — prep brief from rounds 1-4 */}
      {phase === "pitch" && team.preFinalBrief && (
        <section
          className="rounded p-4 mb-4"
          style={{ background: "#101a14", border: "1px solid #00f5a0" }}
        >
          <div className="font-mono-display text-xs mb-2 tracking-widest" style={{ color: "#00f5a0" }}>
            // AXIOM&apos;S PREP BRIEF — WHAT YOU LEARNED ACROSS ROUNDS 1-4
          </div>
          <p className="text-sm font-mono-display" style={{ color: "#b8e8c8", whiteSpace: "pre-wrap" }}>
            {team.preFinalBrief}
          </p>
        </section>
      )}

      {/* PITCH PHASE — write & submit your pitch */}
      {phase === "pitch" && (
        <section
          className="rounded p-4"
          style={{ background: "#12121a", border: "1px solid #ffaa00" }}
        >
          <div className="font-mono-display text-xs mb-3 tracking-widest" style={{ color: "#ffaa00" }}>
            // YOUR FINAL PITCH {submittedPitch ? "· ✓ SUBMITTED (you can still edit & resubmit)" : ""}
          </div>
          {voiceMode ? (
            <>
              <div className="font-mono-display text-xs mb-2" style={{ color: "#8be9b0" }}>
                🎤 This is a spoken pitch to the whole panel. Tap DICTATE, deliver it out loud, tap STOP — then SUBMIT. One pitch. No typing.
              </div>
              <div
                className="rounded p-3 text-sm font-mono-display"
                style={{
                  background: "#0a0a0f",
                  border: `1px solid ${listening ? "#ff3d8a" : "#2a2a3a"}`,
                  color: pitch ? "#e8e8f0" : "#5a5a6a",
                  minHeight: "10rem",
                  maxHeight: "55vh",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {pitch || (listening ? "listening…" : "Tap DICTATE and deliver your pitch. Name their real problems; tie it together for the CEO.")}
              </div>
              <div className="flex justify-between items-center mt-2" style={{ color: "#8888aa" }}>
                <div className="font-mono-display text-xs">
                  {listening ? (
                    <span style={{ color: "#ff3d8a" }}>● listening… deliver your pitch</span>
                  ) : overtime ? (
                    <span style={{ color: "#ffaa00" }}>⏱ overtime — wrap up & submit</span>
                  ) : (
                    <>
                      {pitch.length} chars{pitch.trim().length < 20 ? " · keep going" : " · ready"}
                      {pitchError && <span className="ml-3" style={{ color: "#ff3d3d" }}>{pitchError}</span>}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn font-mono-display text-sm"
                    onClick={() => { if (listening) { speech.stop(); } else { speech.start(pitch); } }}
                    title="Dictate — tap again to add more"
                    style={{ background: listening ? "#ff3d8a" : "#00f5a0", color: "#0a0a0f" }}
                  >
                    {listening ? "● STOP" : pitch ? "🎤 ADD MORE" : "🎤 DICTATE"}
                  </button>
                  {pitch && !listening && (
                    <button
                      className="btn font-mono-display text-sm"
                      onClick={() => { setPitch(""); speech.reset(); }}
                      title="Clear and start over"
                    >
                      ✕ CLEAR
                    </button>
                  )}
                  <button
                    className="btn btn-primary font-mono-display text-sm"
                    disabled={pitch.trim().length < 20 || submitting || listening}
                    onClick={() => handleSubmitPitch()}
                    style={pitch.trim().length < 20 || submitting || listening ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  >
                    {submitting ? "…" : submittedPitch ? "RESUBMIT ▸" : "SUBMIT PITCH ▸"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="font-mono-display text-xs mb-2" style={{ color: "#8be9b0" }}>
                {showMic ? "⌨️ Type your pitch — or tap 🎤 DICTATE to speak it. Paste is disabled — use your own words." : "Voice isn't supported — type your pitch (paste is disabled — use your own words)."}
              </div>
              <textarea
                className="w-full rounded p-3 text-sm font-mono-display resize-none"
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", color: "#e8e8f0", outline: "none", height: "12rem" }}
                placeholder="Type your pitch. Use what you learned; name their real problems."
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
              />
              <div className="flex justify-between items-center mt-2" style={{ color: "#8888aa" }}>
                <div className="font-mono-display text-xs">
                  {pitch.length} chars
                  {pitchError && <span className="ml-3" style={{ color: "#ff3d3d" }}>{pitchError}</span>}
                </div>
                <div className="flex gap-2">
                  {showMic && (
                    <button
                      className="btn font-mono-display text-sm"
                      onClick={() => { if (listening) { speech.stop(); } else { speech.start(pitch); } }}
                      style={{ background: listening ? "#ff3d8a" : "#00f5a0", color: "#0a0a0f" }}
                    >
                      {listening ? "● STOP" : pitch ? "🎤 ADD MORE" : "🎤 DICTATE"}
                    </button>
                  )}
                  <button
                    className="btn btn-primary font-mono-display text-sm"
                    disabled={pitch.trim().length < 20 || submitting}
                    onClick={() => { if (listening) speech.stop(); handleSubmitPitch(); }}
                    style={pitch.trim().length < 20 || submitting ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  >
                    {submitting ? "…" : submittedPitch ? "RESUBMIT ▸" : "SUBMIT PITCH ▸"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
