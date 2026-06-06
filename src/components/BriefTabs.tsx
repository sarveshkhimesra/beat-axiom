"use client";

import { useState } from "react";
import { COMPANIES } from "@/lib/content/companies";
import { findDm } from "@/lib/content/customers";
import { CompanyId, CompanyProfile, CustomerProfile } from "@/lib/types";

// The decision-makers teams actually meet, in round order — the "who's who" for
// the static dossier. (Excludes org-chart names who never take a meeting.)
const DOSSIER_DM_ORDER: { round: number; id: string }[] = [
  { round: 1, id: "gatekeeper" },
  { round: 2, id: "vp_product" },
  { round: 3, id: "vp_tech" },
  { round: 4, id: "vp_finance" },
  { round: 5, id: "ceo" },
];

type BriefTab = "self" | "customer" | "competition" | "hidden";

// Tabbed brief: SELF (your own company) · CUSTOMER (company + decision-makers) ·
// COMPETITION (a detailed read on each rival) · HIDE (collapse for a clean screen).
export function BriefTabs({
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
