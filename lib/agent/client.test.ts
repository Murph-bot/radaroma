import { describe, expect, it } from "vitest"
import { OpenRouterLlm } from "./client"

// The agent loop replays assistant tool calls back to the API. They must go
// over the wire in OpenAI's shape ({id, type:"function", function:{...}}) —
// sending our internal {id, name, arguments} shape makes the model re-call
// tools forever and exhaust the round cap.
describe("OpenRouterLlm wire format", () => {
  it("serializes assistant toolCalls in the OpenAI function-call shape", async () => {
    let sent: { messages?: unknown[] } = {}
    const fakeOpenAi = {
      chat: {
        completions: {
          create: async (req: { messages?: unknown[] }) => {
            sent = req
            return { choices: [{ message: { content: "ok", tool_calls: [] } }] }
          },
        },
      },
    }
    const llm = new OpenRouterLlm(
      fakeOpenAi as never,
      "deepseek/deepseek-v4-flash-0731",
    )

    await llm.complete({
      system: "sys",
      messages: [
        { role: "user", content: "hi" },
        {
          role: "assistant",
          content: null,
          toolCalls: [{ id: "call_1", name: "queryCafesByWeights", arguments: "{}" }],
        },
        { role: "tool", content: "[]", toolCallId: "call_1" },
      ],
    })

    const messages = sent.messages as Record<string, unknown>[]
    expect(messages[1]).toEqual({
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "queryCafesByWeights", arguments: "{}" },
        },
      ],
    })
    expect(messages[2]).toEqual({
      role: "tool",
      content: "[]",
      tool_call_id: "call_1",
    })
  })
})
