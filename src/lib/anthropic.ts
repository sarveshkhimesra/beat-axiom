import Anthropic from "@anthropic-ai/sdk";

export const anthropicClient = new Anthropic({
  apiKey: "azure-placeholder",
  baseURL: process.env.AZURE_ANTHROPIC_ENDPOINT!,
  defaultHeaders: {
    Authorization: `Bearer ${process.env.AZURE_ANTHROPIC_API_KEY!}`,
  },
});

export const ANTHROPIC_MODEL =
  process.env.AZURE_ANTHROPIC_MODEL ?? "claude-opus-4-7";

export function extractText(completion: Anthropic.Message): string {
  return completion.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
