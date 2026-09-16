export interface LlmToolCall {
  id: string
  name: string
  arguments: string // JSON string
}

export interface LlmResponse {
  content: string | null
  toolCalls: LlmToolCall[]
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  toolCallId?: string
  toolCalls?: LlmToolCall[]
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}

export interface JsonSchemaSpec {
  name: string
  schema: Record<string, unknown>
}

export interface CompleteRequest {
  system: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  // Provider-enforced structured output (OpenAI response_format: json_schema
  // with strict mode). Only for tool-free calls — combined with `tools` it can
  // break tool calling on some providers.
  jsonSchema?: JsonSchemaSpec
}

// The only LLM surface the agent loop depends on — production is
// OpenRouterLlm, tests inject scripted fakes.
export interface LlmPort {
  complete(req: CompleteRequest): Promise<LlmResponse>
}
