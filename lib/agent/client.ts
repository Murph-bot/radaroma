import OpenAI from "openai"
import type { CompleteRequest, LlmPort, LlmResponse } from "./types"

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
const DEFAULT_MODEL = "openai/gpt-4o"

// Provider-agnostic: OpenRouter is the default, but LLM_BASE_URL / LLM_API_KEY
// / LLM_MODEL can point at any OpenAI-compatible endpoint.
export class OpenRouterLlm implements LlmPort {
  constructor(
    private client: OpenAI,
    private model: string,
  ) {}

  async complete(req: CompleteRequest): Promise<LlmResponse> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCallId !== undefined && { tool_call_id: m.toolCallId }),
        ...(m.toolCalls !== undefined && { tool_calls: m.toolCalls }),
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      ...(req.tools && req.tools.length > 0
        ? {
            tools: req.tools.map((t) => ({
              type: "function" as const,
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            })),
          }
        : {}),
    })

    const choice = res.choices[0]
    const message = choice?.message
    return {
      content: message?.content ?? null,
      toolCalls: (message?.tool_calls ?? []).flatMap((tc) => {
        // SDK v7 unions function tool calls with custom/other call types
        if (tc.type !== "function") return []
        return [
          {
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        ]
      }),
    }
  }
}

// Factory reading env vars. Throws with a clear message when the key is
// missing — the app degrades gracefully at the route level.
export function createLlmClient(): LlmPort {
  const apiKey = process.env.LLM_API_KEY
  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY is not set — add your OpenRouter key to .env.local / .dev.vars",
    )
  }
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL,
  })
  return new OpenRouterLlm(client, process.env.LLM_MODEL ?? DEFAULT_MODEL)
}
