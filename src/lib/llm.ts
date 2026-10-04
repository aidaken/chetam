import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

function requireGatewayEnv() {
  const token = process.env.NEON_AI_GATEWAY_TOKEN?.trim();
  const base = process.env.NEON_AI_GATEWAY_BASE_URL?.trim();
  if (!token || !base) {
    throw new Error(
      "NEON_AI_GATEWAY_TOKEN and NEON_AI_GATEWAY_BASE_URL are required",
    );
  }
  return {
    apiKey: token,
    baseURL: `${base.replace(/\/$/, "")}/v1`,
    model: process.env.LLM_MODEL?.trim() || "gpt-5-mini",
  };
}

/** Official OpenAI SDK client pointed at Neon AI Gateway chat completions. */
export function getOpenAIClient() {
  const { apiKey, baseURL } = requireGatewayEnv();
  return new OpenAI({ apiKey, baseURL });
}

/** AI SDK provider for Mastra — forces /v1 chat completions (not Responses). */
export function getChetamLanguageModel() {
  const { apiKey, baseURL, model } = requireGatewayEnv();
  const provider = createOpenAI({
    apiKey,
    baseURL,
    name: "neon-ai-gateway",
  });
  return provider.chat(model);
}

export function getLlmModelId() {
  return process.env.LLM_MODEL?.trim() || "gpt-5-mini";
}

/** Tiny ping for /api/health. Logs status + error body on failure (never secrets). */
export async function pingLlm(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { model } = requireGatewayEnv();
    const client = getOpenAIClient();
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "ping" }],
      max_completion_tokens: 8,
    });
    if (!res.choices?.length) {
      console.error("[llm] ping unexpected response shape", {
        id: res.id,
        model: res.model,
      });
      return { ok: false, error: "empty choices in completion response" };
    }
    return { ok: true };
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? Number((error as { status?: number }).status)
        : undefined;
    const body =
      error && typeof error === "object" && "error" in error
        ? (error as { error?: unknown }).error
        : error instanceof Error
          ? error.message
          : String(error);
    console.error("[llm] ping failed", { status, body });
    return {
      ok: false,
      error: status
        ? `HTTP ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`
        : error instanceof Error
          ? error.message
          : "LLM ping failed",
    };
  }
}
