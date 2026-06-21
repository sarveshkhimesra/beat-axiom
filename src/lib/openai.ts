import { AzureOpenAI } from "openai";

// Azure OpenAI client — used for fast calls (variator + buyer turns).
// GPT-4o is fast (~2-3s) and good for conversation + generation tasks.
export const openaiClient = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
  endpoint: process.env.AZURE_OPENAI_ENDPOINT ?? "",
  apiVersion: "2024-02-15-preview",
});

export const OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "sales-analysis-gpt4o";

/** Simple helper: send a system + user message, get text back. */
export async function chatCompletion(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const res = await openaiClient.chat.completions.create({
    model: OPENAI_DEPLOYMENT,
    max_tokens: args.maxTokens ?? 800,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

/** Multi-turn helper: send system + full message history, get text back. */
export async function chatCompletionWithHistory(args: {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}): Promise<string> {
  const res = await openaiClient.chat.completions.create({
    model: OPENAI_DEPLOYMENT,
    max_tokens: args.maxTokens ?? 600,
    messages: [
      { role: "system", content: args.system },
      ...args.messages,
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}
