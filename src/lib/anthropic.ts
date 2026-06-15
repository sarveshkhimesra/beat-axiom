import Anthropic from "@anthropic-ai/sdk";

// Route through Razorpay's internal LiteLLM proxy. The SDK apiKey is a dummy;
// the real credential travels in the x-litellm-api-key header. LiteLLM exposes
// the Anthropic /v1/messages route, so the Messages API shape is unchanged.
export const anthropicClient = new Anthropic({
  apiKey: "dummy",
  baseURL: process.env.LITELLM_BASE_URL!,
  defaultHeaders: {
    "x-litellm-api-key": process.env.LITELLM_API_KEY!,
  },
});

// Default model name as registered in LiteLLM. Duel routes override per-call
// via DUEL_AVATAR_MODEL / DUEL_VERDICT_MODEL (see src/lib/duel/config.ts).
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function extractText(completion: Anthropic.Message): string {
  return completion.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
