import { ScenarioId } from "./types";

export interface ClientScenario {
  id: ScenarioId;
  title: string;
  product: string;
  setup: string;
  buyer: {
    name: string;
    role: string;
  };
}

export const CLIENT_SCENARIOS: Record<ScenarioId, ClientScenario> = {
  "skeptical-vp": {
    id: "skeptical-vp",
    title: "The Skeptical VP",
    product: "a team-productivity platform",
    setup: "You're selling a team-productivity platform to a VP of Operations who was burned by a tool rollout that died in adoption. You have 7 minutes to win the deal.",
    buyer: { name: "Dana Whitfield", role: "VP of Operations" },
  },
  "cutting-cfo": {
    id: "cutting-cfo",
    title: "The Cost-Cutting CFO",
    product: "a managed-service engagement",
    setup: "You're selling a managed-service engagement to a CFO under board pressure to cut spend. You have 7 minutes to win the deal.",
    buyer: { name: "Marcus Lee", role: "Chief Financial Officer" },
  },
  "committee-gatekeeper": {
    id: "committee-gatekeeper",
    title: "The Committee Gatekeeper",
    product: "an enterprise software platform",
    setup: "You're selling an enterprise platform to a procurement-minded gatekeeper running a formal evaluation. You have 7 minutes to win the deal.",
    buyer: { name: "Priya Nandakumar", role: "Head of Procurement" },
  },
  "enthusiastic-champion": {
    id: "enthusiastic-champion",
    title: "The Enthusiastic Champion",
    product: "a workflow-automation platform",
    setup: "You're selling a workflow-automation platform to an internal champion who loves you — but can't sign. You have 7 minutes to win the deal.",
    buyer: { name: "Ethan Morales", role: "Senior Product Manager" },
  },
  "silent-evaluator": {
    id: "silent-evaluator",
    title: "The Silent Technical Evaluator",
    product: "a developer-infrastructure platform",
    setup: "You're selling a dev-infrastructure platform to a principal engineer who barely speaks. You have 7 minutes to win the deal.",
    buyer: { name: "Dr. Lena Karim", role: "Principal Engineer" },
  },
};

export const CLIENT_SCENARIO_IDS = Object.keys(CLIENT_SCENARIOS) as ScenarioId[];
