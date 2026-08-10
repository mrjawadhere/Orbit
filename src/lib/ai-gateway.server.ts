import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Gemini provider for the AI SDK (via Google's OpenAI compatibility endpoint). Server-only. */
export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
