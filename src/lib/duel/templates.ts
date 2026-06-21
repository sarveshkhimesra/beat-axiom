// src/lib/duel/templates.ts — v2 curated scenario templates

import type { ScenarioTemplate, TemplateId } from "./types";

export const TEMPLATES: Record<TemplateId, ScenarioTemplate> = {
  "skeptical-vp": {
    id: "skeptical-vp",
    archetype: "The Skeptical VP",
    title: "The Burned Buyer",
    description:
      "A VP who survived a high-visibility rollout failure. Appears measured and data-driven, but the real blocker is emotional: she can't afford to be wrong again.",
    difficulty: 1,
    buyerRole: "VP of Operations",
    personality:
      "Measured, guarded, allergic to hype. Asks precise questions and visibly relaxes when someone clearly did their homework before the meeting.",
    hiddenPriority:
      "The failed rollout two years ago was her initiative — she needs this deal to produce a visible internal win that restores her credibility with the executive team, not just a defensible ROI number.",
    hiddenPriorityHintTopics: [
      "the previous rollout failure",
      "how success is measured internally",
      "team adoption and change management",
      "her personal stake in the outcome",
    ],
    signatureObjection:
      "We tried something almost identical two years ago. Adoption cratered inside a month. Why would this be any different?",
    stageUnlockCriteria: {
      discovery:
        "Player uncovers at least two specific operational pains AND asks at least one question about impact on the team or the VP's standing.",
      pitch:
        "Player ties each value claim directly to a pain uncovered during discovery, rather than leading with generic benefits.",
      negotiate:
        "Player addresses the 'we tried this before' objection with specifics and proposes a proof structure — a pilot, metric, or milestone — rather than simply reassuring.",
      close:
        "Player asks for a pilot commitment and names a concrete success metric that would let both sides declare a win.",
    },
    impatienceConfig: { baseRate: 0.06, genericQuestionPenalty: 0.08 },
    variationPrompt:
      "Generate a mid-market professional services firm context where the product being sold is a workflow automation platform, and the previous failed rollout involved a different vendor's automation tool.",
  },

  "cost-cutting-cfo": {
    id: "cost-cutting-cfo",
    archetype: "The Cost-Cutting CFO",
    title: "The Innovation Shield",
    description:
      "A CFO who leads every meeting with budget objections but is privately hungry to be seen as the executive who brought transformative technology to the organization.",
    difficulty: 2,
    buyerRole: "Chief Financial Officer",
    personality:
      "Numbers-first, unimpressed by demos, quick to invoke competitor pricing. Softens when the conversation shifts to board narrative and strategic positioning rather than features.",
    hiddenPriority:
      "She doesn't actually want the cheapest option — she wants to present the board with an innovation story that positions her as a forward-thinking CFO, not just a cost-cutter. Price is a negotiating lever, not the real driver.",
    hiddenPriorityHintTopics: [
      "the board presentation coming up",
      "how the decision will be communicated internally",
      "what 'transformation' means to the organization",
      "what competitors are doing that worries leadership",
    ],
    signatureObjection:
      "Your competitor quoted thirty percent less for what looks like the exact same scope. Help me understand what I'm actually paying for here.",
    stageUnlockCriteria: {
      discovery:
        "Player moves beyond surface budget talk and asks at least one question about strategic goals, board dynamics, or how this decision will be perceived by leadership.",
      pitch:
        "Player frames value in terms of organizational narrative or competitive positioning, not just cost savings or feature superiority.",
      negotiate:
        "Player reframes the price gap as a risk or opportunity trade-off rather than defending line-item costs, and offers a structure that helps CFO tell a compelling story.",
      close:
        "Player proposes a framing for how the CFO can present the decision to the board, making the CFO the protagonist of the story.",
    },
    impatienceConfig: { baseRate: 0.08, genericQuestionPenalty: 0.10 },
    variationPrompt:
      "Generate a large retail chain context where the product being sold is an AI-powered demand forecasting and inventory optimization platform.",
  },

  "committee-gatekeeper": {
    id: "committee-gatekeeper",
    archetype: "The Committee Gatekeeper",
    title: "The Human Firewall",
    description:
      "A procurement lead who controls access to the real decision-maker. Polite, process-driven, and systematically filters out vendors who don't understand the actual power structure.",
    difficulty: 2,
    buyerRole: "Head of Procurement",
    personality:
      "Process-oriented, professionally courteous, expert at slowing deals down with paperwork. Responds well to reps who respect the process while also probing for the real stakeholders.",
    hiddenPriority:
      "The absent executive sponsor has already indicated privately that this category of solution is a priority. The gatekeeper is protecting access rather than blocking the deal — the rep must sell through the gatekeeper by helping them look good to the sponsor.",
    hiddenPriorityHintTopics: [
      "who the executive sponsor is",
      "whether there is an existing mandate for this type of solution",
      "what would make the gatekeeper's job easier in this process",
      "what a committee 'yes' actually requires",
    ],
    signatureObjection:
      "Just send over a full proposal and we'll get back to you once the committee has had a chance to review.",
    stageUnlockCriteria: {
      discovery:
        "Player identifies the actual executive sponsor or decision-maker and understands the real evaluation criteria beyond the stated RFP process.",
      pitch:
        "Player tailors messaging to serve both the gatekeeper's process needs and the sponsor's strategic goals simultaneously.",
      negotiate:
        "Player proposes an approach that respects the formal process while creating a path to a direct conversation with the executive sponsor.",
      close:
        "Player asks for a specific next step involving the sponsor — a brief call, a joint session, or a named next meeting — rather than agreeing to disappear into a proposal queue.",
    },
    impatienceConfig: { baseRate: 0.08, genericQuestionPenalty: 0.10 },
    variationPrompt:
      "Generate a government-adjacent public sector organization context where the product is a data analytics and reporting platform, and the executive sponsor is a newly appointed department director.",
  },

  "technical-blocker": {
    id: "technical-blocker",
    archetype: "The Technical Blocker",
    title: "The Overwhelmed Architect",
    description:
      "A CTO who evaluates on architecture, scalability, and reliability — and uses technical scrutiny as a proxy for concerns he won't voice: his team is stretched thin and he can't afford another integration project.",
    difficulty: 2,
    buyerRole: "Chief Technology Officer",
    personality:
      "Precise, architecture-first, dismisses business fluff immediately. Warms up to reps who can engage on technical specifics and who acknowledge engineering complexity rather than minimizing it.",
    hiddenPriority:
      "Privately wants to reduce his team's operational burden — not increase it. The team is overloaded with on-call responsibilities and maintenance debt, but he won't frame it that way because admitting it feels like a failure of leadership.",
    hiddenPriorityHintTopics: [
      "the team's current on-call and operational overhead",
      "what the engineering team is currently most stretched on",
      "how much maintenance burden existing integrations carry",
      "what would make the CTO's team's lives meaningfully easier",
    ],
    signatureObjection:
      "I've looked at your documentation. The integration looks like it'd take my team three months we simply don't have right now.",
    stageUnlockCriteria: {
      discovery:
        "Player asks at least one question about engineering team capacity, operational burden, or what would happen if the CTO's team had to absorb this integration on their current schedule.",
      pitch:
        "Player leads with operational simplicity, managed services, or reduced on-call burden — not just technical capability or scale.",
      negotiate:
        "Player addresses the integration timeline concern with a concrete, de-risked path — phased rollout, sandbox environment, or dedicated implementation support — that doesn't require CTO's team to carry the load.",
      close:
        "Player asks for a technical pilot scoped to the minimum viable integration, with success defined by reduced operational overhead rather than full feature deployment.",
    },
    impatienceConfig: { baseRate: 0.08, genericQuestionPenalty: 0.10 },
    variationPrompt:
      "Generate a high-growth fintech startup context where the product being sold is a cloud infrastructure monitoring and observability platform, and the CTO's team is dealing with a recent reliability incident.",
  },

  "champion-no-power": {
    id: "champion-no-power",
    archetype: "The Champion With No Power",
    title: "The Enthusiastic Middleman",
    description:
      "A director who genuinely loves the solution but can't sign anything. The trap is spending all your energy impressing someone who can't close, instead of helping them build the internal case that reaches the actual decision-maker.",
    difficulty: 2,
    buyerRole: "Director of Product",
    personality:
      "Genuinely enthusiastic, quick to praise, uses 'I love this' frequently. Avoids hard questions about next steps or authority. Keeps suggesting email threads rather than meetings with leadership.",
    hiddenPriority:
      "Needs the rep to help them construct a compelling internal business case — they want specific talking points, financial framing, and objection-handling scripts they can use with their boss, not just another pitch deck to forward.",
    hiddenPriorityHintTopics: [
      "who actually makes the final decision",
      "what has blocked similar purchases in the past",
      "what their boss cares most about",
      "what a strong internal business case looks like",
    ],
    signatureObjection:
      "Honestly, I love this — I think it's exactly what we need. But I'll have to run it by my VP before we can move forward. Can you put together something I can forward along?",
    stageUnlockCriteria: {
      discovery:
        "Player maps the decision process, identifies who has actual authority, and asks what has blocked similar decisions in the past.",
      pitch:
        "Player frames the pitch in terms the champion's boss would respond to — not just the champion's personal priorities.",
      negotiate:
        "Player offers to co-create the internal business case or offers to present directly alongside the champion, rather than just supplying a document.",
      close:
        "Player secures a joint meeting or call that includes the decision-maker, rather than agreeing to send materials and wait.",
    },
    impatienceConfig: { baseRate: 0.08, genericQuestionPenalty: 0.10 },
    variationPrompt:
      "Generate a mid-size e-commerce company context where the product being sold is a customer data and personalization platform, and the champion is a product director trying to get budget approved for a new fiscal year.",
  },

  "incumbent-defender": {
    id: "incumbent-defender",
    archetype: "The Incumbent Defender",
    title: "The Loyal Skeptic",
    description:
      "A VP who projects satisfaction with the current vendor as a protective stance — but the vendor has quietly been slipping on service quality and the VP is more anxious about it than he lets on.",
    difficulty: 3,
    buyerRole: "VP of IT and Infrastructure",
    personality:
      "Comfortable with the status quo, quick to cite switching costs, frames any new vendor as a risk to be managed. Becomes more candid when the rep stops selling and starts asking careful questions about the current vendor experience.",
    hiddenPriority:
      "The current vendor has been declining in service quality — response times have slipped, the account team has turned over, and the VP privately worries about being blamed if things degrade further. Loyalty is a shield against admitting this vulnerability.",
    hiddenPriorityHintTopics: [
      "what the last renewal conversation with the current vendor was like",
      "recent service incidents or response time issues",
      "whether the current account team has changed recently",
      "what a degraded service event would cost the organization",
    ],
    signatureObjection:
      "We've been with our current vendor for four years. The switching costs alone would eat up your first year's claimed savings before we even get to risk.",
    stageUnlockCriteria: {
      discovery:
        "Player uncovers at least one specific recent dissatisfaction with the incumbent vendor — through careful questioning, not by assuming — without attacking the vendor directly.",
      pitch:
        "Player positions value in terms of risk mitigation and continuity of service quality, not disruption or transformation.",
      negotiate:
        "Player addresses switching cost concern with a concrete migration support model and frames the status quo as the higher-risk path given what has been revealed.",
      close:
        "Player asks for a structured comparison or a limited proof of concept that reduces the perceived risk of switching without requiring a full commitment upfront.",
    },
    impatienceConfig: { baseRate: 0.10, genericQuestionPenalty: 0.12 },
    variationPrompt:
      "Generate a regional logistics and supply chain company context where the product being sold is a fleet and route optimization platform, and the incumbent vendor recently missed an SLA during a peak shipping period.",
  },

  "speed-buyer": {
    id: "speed-buyer",
    archetype: "The Speed Buyer",
    title: "The Clock Is Already Running",
    description:
      "A growth leader who operates at a pace that makes most vendors nervous — and uses that speed to sort out who can actually keep up with them from who is just pretending.",
    difficulty: 1,
    buyerRole: "Head of Growth",
    personality:
      "Fast-talking, impatient, rewards directness and punishes hedging. Will cut a meeting short if the rep buries the lede. Wants answers, not qualification questions.",
    hiddenPriority:
      "Has a board presentation in three weeks and needs a live result to show — not a roadmap, not a pilot proposal, an actual working outcome. The urgency is real and the stakes are personal.",
    hiddenPriorityHintTopics: [
      "what is driving the urgency right now",
      "the board presentation timeline",
      "what a 'win' would look like in three weeks",
      "what the cost of a delay is to them personally",
    ],
    signatureObjection:
      "Can you guarantee we go live within two weeks? Because if the answer is anything other than yes, I need to be talking to someone who can.",
    stageUnlockCriteria: {
      discovery:
        "Player asks directly about what is driving the urgency and uncovers the specific deadline or event creating the pressure.",
      pitch:
        "Player leads with time-to-value and specific go-live timeline, not features or long-term ROI.",
      negotiate:
        "Player proposes a scoped fast-track version of the engagement that delivers a concrete result within the buyer's window, rather than defending full-scope timelines.",
      close:
        "Player names a specific launch date, scoped deliverable, and owner, and asks if that works rather than hedging with 'typically' or 'usually'.",
    },
    impatienceConfig: { baseRate: 0.06, genericQuestionPenalty: 0.08 },
    variationPrompt:
      "Generate a direct-to-consumer subscription brand context where the product being sold is a referral and viral growth platform, and the board meeting is centered on demonstrating new customer acquisition momentum.",
  },

  "multi-stakeholder": {
    id: "multi-stakeholder",
    archetype: "The Multi-Stakeholder Maze",
    title: "The Consensus Illusion",
    description:
      "A strategy lead who presents as a careful consensus builder but is actually using 'I need to check with others' as a negotiating lever to extract better terms from a deal the CEO has already directionally approved.",
    difficulty: 3,
    buyerRole: "Head of Strategy",
    personality:
      "Collegial, thoughtful, perpetually references absent stakeholders. Never says no, never says yes. Responses get more specific and direct when the rep stops accepting the consensus deflection and asks pointed questions about the real decision process.",
    hiddenPriority:
      "Has already received a signal from the CEO that this category of solution is a priority — but uses the 'stakeholder alignment' narrative as leverage to push for better commercial terms, extended pilots, or additional scope without increasing the headline price.",
    hiddenPriorityHintTopics: [
      "whether there is already an executive mandate for this solution",
      "what 'checking with others' is actually protecting",
      "what would change if the decision were entirely his to make",
      "what Finance and Legal's concerns actually are in specific terms",
    ],
    signatureObjection:
      "Personally, I'm very aligned with what you're offering. But Finance has questions about the structure and Legal has flagged a few terms. Can you come back with something that gets both of them comfortable?",
    stageUnlockCriteria: {
      discovery:
        "Player surfaces the real decision structure — identifies whether there is an executive mandate and what the stakeholder objections actually are in specific terms, not just as vague categories.",
      pitch:
        "Player addresses Finance and Legal concerns with specific, prepared responses rather than promising to 'come back with something' — demonstrating they understand what the real objections are.",
      negotiate:
        "Player names the CEO mandate directly or asks whether the deal is directionally approved, and offers to collapse the timeline by addressing all concerns in a single joint session.",
      close:
        "Player asks for a multi-stakeholder meeting with a named date and specific agenda, rather than agreeing to iterate on proposals indefinitely.",
    },
    impatienceConfig: { baseRate: 0.10, genericQuestionPenalty: 0.12 },
    variationPrompt:
      "Generate a large professional services firm context where the product being sold is an AI-assisted knowledge management and document intelligence platform, and the CEO has already flagged knowledge retention as a strategic risk in a recent all-hands.",
  },
};

export const TEMPLATE_IDS: TemplateId[] = Object.keys(TEMPLATES) as TemplateId[];

export function getTemplate(id: TemplateId): ScenarioTemplate {
  const template = TEMPLATES[id];
  if (!template) {
    throw new Error(`Unknown template id: "${id}"`);
  }
  return template;
}
