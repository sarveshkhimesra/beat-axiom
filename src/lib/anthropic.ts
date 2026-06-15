import Anthropic from "@anthropic-ai/sdk";

// Provider selection, in priority order:
//   1. Razorpay LiteLLM gateway  (apiKey "dummy" + x-litellm-api-key header)
//   2. Azure-hosted Anthropic    (apiKey placeholder + Bearer auth) — used for
//      local dev until the LiteLLM key is available
//   3. Direct Anthropic API      (ANTHROPIC_API_KEY)
function makeClient(): Anthropic {
  if (process.env.LITELLM_BASE_URL) {
    return new Anthropic({
      apiKey: "dummy",
      baseURL: process.env.LITELLM_BASE_URL,
      defaultHeaders: { "x-litellm-api-key": process.env.LITELLM_API_KEY ?? "" },
    });
  }
  if (process.env.AZURE_ANTHROPIC_ENDPOINT) {
    return new Anthropic({
      apiKey: "azure-placeholder",
      baseURL: process.env.AZURE_ANTHROPIC_ENDPOINT,
      defaultHeaders: { Authorization: `Bearer ${process.env.AZURE_ANTHROPIC_API_KEY ?? ""}` },
    });
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "missing" });
}

export const anthropicClient = makeClient();

// Default model / deployment name. LiteLLM and direct use ANTHROPIC_MODEL;
// Azure uses its deployment name in AZURE_ANTHROPIC_MODEL.
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function extractText(completion: Anthropic.Message): string {
  return completion.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
