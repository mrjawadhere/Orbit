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

/** Lovable AI Gateway provider for the AI SDK. Server-only. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const ORBIT_MODEL = "google/gemini-3.6-flash";
export const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
