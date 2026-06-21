import Anthropic from "@anthropic-ai/sdk";

// Provider selection:
//   1. Azure-hosted Anthropic (Bearer auth)
//   2. Direct Anthropic API (ANTHROPIC_API_KEY)
function makeClient(): Anthropic {
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

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? process.env.AZURE_ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export function extractText(completion: Anthropic.Message): string {
  return completion.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
