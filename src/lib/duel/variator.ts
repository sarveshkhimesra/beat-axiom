import { chatCompletion } from "@/lib/openai";
import { GeneratedScenario, ScenarioTemplate } from "./types";

export async function generateScenario(
  template: ScenarioTemplate,
  filters?: { industry?: string }
): Promise<GeneratedScenario> {
  const system = "You generate sales scenario variations. Return ONLY a JSON object, no markdown fences, no prose before or after.";

  const user = `Generate a sales scenario variation. Use the template below as the STRUCTURAL foundation (hidden priority, objection, personality, difficulty). Generate FRESH surface details: a new company name, a 2-sentence backstory, a buyer name, specific pain-point numbers, a budget signal, and a product being sold. ${filters?.industry ? `Set in the ${filters.industry} industry.` : "Pick any B2B industry."}

TEMPLATE:
- Archetype: ${template.archetype}
- Buyer role: ${template.buyerRole}
- Personality: ${template.personality}
- Hidden priority: ${template.hiddenPriority}
- Signature objection: ${template.signatureObjection}
- Variation instructions: ${template.variationPrompt}

Return ONLY this JSON:
{
  "companyName": "<invented company name>",
  "backstory": "<2 sentences about the company>",
  "buyerName": "<full name>",
  "product": "<what the player is selling — include the product name and a one-line description>",
  "sellerStrength": "<one specific strength>",
  "sellerWeakness": "<one specific weakness>",
  "surfacePains": ["<pain 1 with a specific number>", "<pain 2 with a metric>", "<pain 3>"],
  "budgetSignal": "<1 sentence>",
  "brief": "<4-5 sentence player-facing brief explaining: what you're selling, who to, what their situation is, and what your goal is>"
}`;

  const raw = await chatCompletion({ system, user, maxTokens: 800 });
  console.log("[variator] response length:", raw.length);

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.error("[variator] no JSON found:", raw.slice(0, 200));
    throw new Error("variator returned no JSON");
  }
  let generated;
  try {
    generated = JSON.parse(raw.slice(start, end + 1));
  } catch (parseErr) {
    console.error("[variator] parse failed:", (parseErr as Error).message);
    throw new Error("variator returned invalid JSON");
  }

  return {
    templateId: template.id,
    title: template.title,
    companyName: generated.companyName ?? "Unknown Corp",
    backstory: generated.backstory ?? "",
    buyerName: generated.buyerName ?? "Alex Morgan",
    buyerRole: template.buyerRole,
    personality: template.personality,
    product: generated.product ?? "a B2B solution",
    sellerStrength: generated.sellerStrength ?? "strong product",
    sellerWeakness: generated.sellerWeakness ?? "limited track record",
    surfacePains: Array.isArray(generated.surfacePains) ? generated.surfacePains : ["General pain"],
    hiddenPriority: template.hiddenPriority,
    hiddenPriorityHintTopics: template.hiddenPriorityHintTopics,
    signatureObjection: template.signatureObjection,
    budgetSignal: generated.budgetSignal ?? "Budget available for the right solution.",
    stageUnlockCriteria: template.stageUnlockCriteria,
    impatienceConfig: template.impatienceConfig,
    brief: generated.brief ?? `You are selling to ${generated.buyerName ?? "the buyer"} at ${generated.companyName ?? "a company"}.`,
  };
}
