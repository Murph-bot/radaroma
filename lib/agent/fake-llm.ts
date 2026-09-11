import type { CompleteRequest, LlmPort, LlmResponse } from "./types"

// Scripted fake for agent tests: returns responses by call index.
export class FakeLlm implements LlmPort {
  requests: CompleteRequest[] = []
  constructor(private script: (req: CompleteRequest, callIndex: number) => LlmResponse) {}

  async complete(req: CompleteRequest): Promise<LlmResponse> {
    this.requests.push(req)
    return this.script(req, this.requests.length - 1)
  }
}

export const textResponse = (content: string): LlmResponse => ({
  content,
  toolCalls: [],
})

export const toolCallResponse = (
  name: string,
  args: Record<string, unknown>,
  id = "call_1",
): LlmResponse => ({
  content: null,
  toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
})
