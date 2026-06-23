import { ScenarioId } from "./types";

export interface ClientScenario {
  id: ScenarioId;
  title: string;
  product: string;
  sellerStrength: string;
  setup: string;
  buyer: {
    name: string;
    role: string;
    company: string;
    companyBrief: string;
  };
}

export const CLIENT_SCENARIOS: Record<ScenarioId, ClientScenario> = {
  "skeptical-vp": {
    id: "skeptical-vp",
    title: "The Skeptical VP",
    product: "a team-productivity platform",
    sellerStrength: "fast time-to-value — teams feel it in week one",
    setup: "You're selling a team-productivity platform to a VP of Operations who was burned by a tool rollout that died in adoption. You have 10 minutes to win the deal.",
    buyer: {
      name: "Deepa Narayan",
      role: "VP of Operations",
      company: "Nexora Systems",
      companyBrief: "Mid-market SaaS company (~800 employees) selling supply-chain software. Growing 40% YoY but struggling with internal operational overhead as teams scale.",
    },
  },
  "cutting-cfo": {
    id: "cutting-cfo",
    title: "The Cost-Cutting CFO",
    product: "a managed-service engagement",
    sellerStrength: "a genuinely senior delivery team",
    setup: "You're selling a managed-service engagement to a CFO under board pressure to cut spend. You have 10 minutes to win the deal.",
    buyer: {
      name: "Vikram Mehta",
      role: "Chief Financial Officer",
      company: "Greenfield Industries",
      companyBrief: "Traditional manufacturing conglomerate (~3,000 employees) undergoing digital transformation. Board wants cost discipline but also modernization — conflicting mandates.",
    },
  },
  "committee-gatekeeper": {
    id: "committee-gatekeeper",
    title: "The Committee Gatekeeper",
    product: "an enterprise software platform",
    sellerStrength: "deep, reliable integrations with existing systems",
    setup: "You're selling an enterprise platform to a procurement-minded gatekeeper running a formal evaluation. You have 10 minutes to win the deal.",
    buyer: {
      name: "Priya Nandakumar",
      role: "Head of Procurement",
      company: "Atlas Financial Group",
      companyBrief: "Large financial services firm (~5,000 employees). Heavily regulated, process-driven. Every vendor goes through a formal evaluation with scorecards and multiple sign-offs.",
    },
  },
  "enthusiastic-champion": {
    id: "enthusiastic-champion",
    title: "The Enthusiastic Champion",
    product: "a workflow-automation platform",
    sellerStrength: "intuitive UX — teams adopt it without training",
    setup: "You're selling a workflow-automation platform to an internal champion who loves you — but can't sign. You have 10 minutes to win the deal.",
    buyer: {
      name: "Arjun Kapoor",
      role: "Senior Product Manager",
      company: "Kinetic Health",
      companyBrief: "Fast-growing healthtech startup (~200 employees). Moved fast early, now drowning in manual processes as they scale. Teams are patching things together with spreadsheets and Slack.",
    },
  },
  "silent-evaluator": {
    id: "silent-evaluator",
    title: "The Silent Technical Evaluator",
    product: "a developer-infrastructure platform",
    sellerStrength: "10x faster CI/CD pipelines — proven benchmarks",
    setup: "You're selling a dev-infrastructure platform to a principal engineer who barely speaks. You have 10 minutes to win the deal.",
    buyer: {
      name: "Dr. Sneha Iyer",
      role: "Principal Engineer",
      company: "Vortex Labs",
      companyBrief: "Series C developer-tools company (~150 engineers). Ships fast but infra is held together with duct tape — Jenkins, manual deploys, 45-min CI. Recently lost a senior engineer partly due to tooling frustration.",
    },
  },
};

export const CLIENT_SCENARIO_IDS = Object.keys(CLIENT_SCENARIOS) as ScenarioId[];
