import { anthropicClient, extractText } from "@/lib/anthropic";
import { VARIATOR_MODEL } from "./config";
import { GeneratedScenario, ScenarioTemplate } from "./types";

export async function generateScenario(
  template: ScenarioTemplate,
  filters?: { industry?: string }
): Promise<GeneratedScenario> {
  const prompt = `Generate a sales scenario variation. Use the template below as the STRUCTURAL foundation (hidden priority, objection, personality, difficulty). Generate FRESH surface details: a new company name, a 2-sentence backstory, a buyer name, specific pain-point numbers, a budget signal, and a product being sold. ${filters?.industry ? `Set in the ${filters.industry} industry.` : "Pick any B2B industry."}

TEMPLATE:
- Archetype: ${template.archetype}
- Buyer role: ${template.buyerRole}
- Personality: ${template.personality}
- Hidden priority: ${template.hiddenPriority}
- Signature objection: ${template.signatureObjection}
- Variation instructions: ${template.variationPrompt}

Return ONLY a JSON object (no markdown fences, no prose):
{
  "companyName": "<invented company name>",
  "backstory": "<2 sentences about the company>",
  "buyerName": "<full name>",
  "product": "<what the player is selling>",
  "sellerStrength": "<one specific strength>",
  "sellerWeakness": "<one specific weakness>",
  "surfacePains": ["<pain 1>", "<pain 2>", "<pain 3>"],
  "budgetSignal": "<1 sentence about budget availability>",
  "brief": "<4-5 sentence player-facing brief explaining the situation>"
}`;

  const completion = await anthropicClient.messages.create({
    model: VARIATOR_MODEL,
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = extractText(completion);
  console.log("[variator] raw response length:", raw.length, "first 200 chars:", raw.slice(0, 200));
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.error("[variator] no JSON found in response. Full response:", raw);
    throw new Error("variator returned no JSON");
  }
  let generated;
  try {
    generated = JSON.parse(raw.slice(start, end + 1));
  } catch (parseErr) {
    console.error("[variator] JSON parse failed:", (parseErr as Error).message, "slice:", raw.slice(start, start + 300));
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
    brief: generated.brief ?? `You are selling ${generated.product ?? "a solution"} to ${generated.buyerName ?? "the buyer"} at ${generated.companyName ?? "a company"}.`,
  };
}
