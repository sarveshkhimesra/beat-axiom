import { CompanyId, CompanyProfile } from "../types";

export const COMPANIES: Record<CompanyId, CompanyProfile> = {
  BLADESTACK: {
    id: "BLADESTACK",
    name: "BladeStack",
    tagline: "The Disruptor. Cocky but usually right.",
    strengths: [
      "Sharpest API stack",
      "Fastest merchant onboarding",
      "Full-stack payments + banking + payroll",
      "Best developer experience",
      "Real-time analytics dashboard",
      "Strong startup and SME brand",
    ],
    weaknesses: [
      "Enterprise credibility thin",
      "Offline POS product nascent",
      "International presence limited",
      'Perceived as "startup tool" not enterprise-grade',
    ],
    floorPriceNote:
      "Mid-competitive. Strong on bundled stack deals. Protect your margin in negotiation.",
    whatRivalsSee:
      "Strong tech product, growing fast, mostly online. (Note: rival view has wrong VP name and overstates offline capability.)",
    briefIdentity:
      "We are BladeStack — India's most loved developer-first payments and financial infrastructure platform. We serve 100k+ businesses, primarily online and SME. Our stack spans payments, banking, payroll, and treasury — built API-first.",
    briefEdge: [
      "Best-in-class developer experience and onboarding (< 24h go-live in 70% of cases)",
      "Full-stack: payments, banking, payroll, treasury — one vendor",
      "Real-time analytics dashboard with cohort-level revenue intelligence",
    ],
    briefWeaknesses: [
      "Offline POS is still maturing — current hardware partnerships are early",
      "Enterprise references concentrated in digital-first businesses; thinner in legacy retail",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer is a large, multi-channel business with both online and offline payment needs. Current stack is fragmented across vendors. They are evaluating now — timing matters.",
    briefCostStructure:
      "Our base processing cost is 38 bps. Platform and support overhead adds 22 bps. Minimum sustainable margin is 15%. Protect it in the close.",
    briefDealStrengths: [
      "Bundled stack deals (payments + banking + payroll) — strongest margin",
      "Volume tiers on online payments",
      "Co-marketing arrangements with high-growth customers",
    ],
  },
  ORBISGLOBAL: {
    id: "ORBISGLOBAL",
    name: "OrbisGlobal",
    tagline: "Old money with new ambitions.",
    strengths: [
      "Cross-border payment rails",
      "BNPL and credit products",
      "Deep-pocketed parent company",
      "Strong EMI network",
      "Regulatory relationships in 15+ markets",
    ],
    weaknesses: [
      "Tech stack dated",
      "Recent acquisition causing internal chaos",
      "Developer experience poor",
      "Onboarding slow",
      "High support escalation rate",
    ],
    floorPriceNote:
      "Can bundle global deals to offset per-transaction pricing. Strong in AMC and retainer models.",
    whatRivalsSee:
      "Global player, strong in credit. (Note: rival view understates internal chaos and shows incorrect market share data.)",
    briefIdentity:
      "We are OrbisGlobal — a global payments and credit platform present in 15+ markets, backed by a global parent. We power cross-border commerce, BNPL, and consumer credit at scale.",
    briefEdge: [
      "Cross-border rails across 15+ regulated markets — unmatched corridor coverage",
      "BNPL and consumer credit products live in production with millions of users",
      "Deep regulatory relationships and licensing in most major markets",
    ],
    briefWeaknesses: [
      "Tech stack older — integration timelines longer than newer entrants",
      "Recent acquisition has caused some org churn — escalation paths still settling",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer has cross-border or multi-currency needs implicit in their business. We can likely solve a problem no one else in the room can.",
    briefCostStructure:
      "Our base processing cost is 45 bps. Platform and support overhead adds 25 bps. Minimum sustainable margin is 12%. Cross-border has separate FX margin (you control this).",
    briefDealStrengths: [
      "AMC + retainer models — sticky revenue",
      "Cross-border bundles (FX + payouts + compliance)",
      "Credit/BNPL revenue share arrangements",
    ],
  },
  VAULTBRIDGE: {
    id: "VAULTBRIDGE",
    name: "VaultBridge",
    tagline: "The bureaucratic fortress. Boring but unshakeable.",
    strengths: [
      "Compliance and enterprise trust",
      "Government payment contracts",
      "Decades of recurring payment rails (insurance, utilities, taxes)",
      "RBI relationships",
      "Zero regulatory risk",
    ],
    weaknesses: [
      "Product stuck in 2015",
      "UI/UX painful",
      "API integration takes months",
      "No startup energy",
      "Cannot move fast on custom requirements",
    ],
    floorPriceNote:
      "Highest floor in the room — they never compete on price. Strength is risk-reduction not cost.",
    whatRivalsSee:
      "Legacy player, government focused. (Note: rival view misses true depth of enterprise relationships and shows wrong contact name.)",
    briefIdentity:
      "We are VaultBridge — India's most trusted recurring payments infrastructure. We process taxes, insurance premiums, utility bills, and government payments at national scale. Compliance and uptime are our religion.",
    briefEdge: [
      "Regulatory and compliance posture unmatched — zero RBI escalations in 12 years",
      "Recurring payments at national scale — proven across taxes, insurance, utilities",
      "Enterprise references include 8 of India's top 10 banks and 12 government bodies",
    ],
    briefWeaknesses: [
      "Product UX shows its age — modern checkout flows require integration work",
      "Custom API work takes longer than newer challengers — quality bar is high",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer operates at scale and any failure is highly visible. They will value risk reduction and compliance.",
    briefCostStructure:
      "Our base processing cost is 30 bps. Compliance and infra overhead adds 18 bps. Minimum sustainable margin is 18% (premium for trust). We rarely discount.",
    briefDealStrengths: [
      "Multi-year enterprise contracts with compliance guarantees",
      "AMC + SLA-backed deals (uptime guarantees)",
      "Risk-pricing — customers pay for our compliance posture",
    ],
  },
  FLOWX: {
    id: "FLOWX",
    name: "FlowX",
    tagline: "The hungry challenger. Scrappy and price-aggressive.",
    strengths: [
      "Lowest pricing",
      "Fastest settlement cycles (T+1)",
      "Payout-first architecture",
      "Clean API",
      "Strong in disbursement and refunds",
      "Fastest go-live",
    ],
    weaknesses: [
      "Brand recognition weak outside startup ecosystem",
      "Enterprise trust thin",
      "Offline nonexistent",
      "No hardware play",
      "Small account management team",
    ],
    floorPriceNote:
      "Lowest in the room. Cost is your weapon, but don't give away all your margin — anchor on value.",
    whatRivalsSee:
      "Cheap option, fast settlements. (Note: rival view overestimates their enterprise sales capacity.)",
    briefIdentity:
      "We are FlowX — the fastest, leanest payments and payouts platform in India. T+1 settlements as standard. Payout-first architecture. Built for businesses that move money in volume.",
    briefEdge: [
      "T+1 settlements as standard — competitors charge premium for this",
      "Payout APIs and refund infrastructure are best-in-class",
      "Fastest go-live in the market — 48-72 hours typical",
    ],
    briefWeaknesses: [
      "Brand recognition outside fintech/startup ecosystem is limited",
      "No hardware or offline POS capability — pure digital play",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer cares about settlement speed, payout reliability, and time-to-live. Our cost advantage is real — protect the margin.",
    briefCostStructure:
      "Our base processing cost is 28 bps. Platform overhead adds 15 bps. Minimum sustainable margin is 10%. Cheap is your edge — but defend some margin.",
    briefDealStrengths: [
      "Volume-tier pricing on payouts and refunds",
      "Bundled disbursement + collection deals",
      "Speed-of-go-live commitments as a value lever",
    ],
  },
  TERRATAP: {
    id: "TERRATAP",
    name: "TerraTap",
    tagline: "The offline kingpin going digital.",
    strengths: [
      "Offline POS dominance",
      "Proprietary hardware + software stack",
      "2000+ enterprise retail deployments",
      "Deep relationships with CFOs and operations heads in large retail",
      "EMI at checkout",
      "Strong in-store experience",
    ],
    weaknesses: [
      "Online payments weak and bolted-on",
      "Not API-driven",
      "Perceived as hardware company not fintech",
      "Digital product team small",
      "Poor checkout conversion online",
    ],
    floorPriceNote:
      "Mid-range. Strongest on bundled hardware + software AMC deals.",
    whatRivalsSee:
      "Hardware POS company, some payments. (Note: rival view understates digital ambition and online product roadmap.)",
    briefIdentity:
      "We are TerraTap — India's leading in-store payments and commerce platform. 2000+ enterprise retail deployments. Hardware, software, and services as one stack. EMI at checkout is our signature.",
    briefEdge: [
      "Offline POS dominance — 2000+ enterprise retail customers, proprietary hardware",
      "EMI at checkout — drives 25-35% ticket-size uplift for retailers",
      "Deep CFO/Ops relationships in large retail — we land at the right level",
    ],
    briefWeaknesses: [
      "Online product is newer and less mature than our offline stack",
      "Pure digital-first customers have historically chosen API-first competitors",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer likely has significant offline footprint or aspirations. Our hardware + software bundle is our unique angle.",
    briefCostStructure:
      "Our base processing cost is 35 bps. Hardware amortization and field-service overhead adds 28 bps. Minimum sustainable margin is 14%. Hardware AMC has separate margin profile.",
    briefDealStrengths: [
      "Bundled hardware + software AMC deals (multi-year, sticky)",
      "EMI revenue-share arrangements with retailer",
      "In-store + online combined contracts",
    ],
  },
  NEXUSPAY: {
    id: "NEXUSPAY",
    name: "NexusPay",
    tagline: "The orchestration layer. Routes around failure.",
    strengths: [
      "Payment orchestration + smart routing across multiple PGs",
      "Best-in-class success-rate optimization (failover, retries, intelligent routing)",
      "Single integration, many providers — vendor-agnostic",
      "Strong checkout SDK and UPI intent flows",
      "Data-rich analytics on where and why payments fail",
    ],
    weaknesses: [
      "It's a layer, not a full processor — depends on underlying PGs for settlement",
      "No banking/lending stack of its own",
      "Newer brand at the boardroom level; better known to engineers than CFOs",
      "Thin on offline/POS",
    ],
    floorPriceNote:
      "Platform/SaaS-style pricing — charges for orchestration on top of underlying PG MDR. Margin sits in the platform fee.",
    whatRivalsSee:
      "A routing layer that lifts success rates. (Note: rival view underrates how sticky orchestration becomes once integrated.)",
    briefIdentity:
      "We are NexusPay — India's payments orchestration layer. One integration routes across every major PG, optimizes success rates with intelligent failover and retries, and gives you a single checkout SDK. We make your existing stack work better instead of ripping it out.",
    briefEdge: [
      "Smart routing + failover that directly lifts payment success rate — often 3-6 points",
      "One integration, every provider — no more juggling three PGs that don't reconcile",
      "Deep failure analytics: we show exactly where and why transactions drop",
    ],
    briefWeaknesses: [
      "We orchestrate, we don't settle — we sit on top of underlying processors",
      "No native banking/lending; we partner rather than own that layer",
    ],
    briefWhatWeKnowAboutCustomer:
      "Customer likely struggles with success rate and a fragmented multi-PG stack — exactly what orchestration fixes.",
    briefCostStructure:
      "We charge a platform fee on top of the underlying PG MDR — roughly 8-15 bps for orchestration. Minimum sustainable margin is 12%. Value is in success-rate uplift, not undercutting MDR.",
    briefDealStrengths: [
      "Platform fee tied to measurable success-rate uplift — pay for performance",
      "Single-integration consolidation story across all existing providers",
      "Analytics + routing as a retained, sticky layer",
    ],
  },
};

export const COMPANY_LIST: CompanyProfile[] = Object.values(COMPANIES);
