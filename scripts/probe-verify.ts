// Debug probe: replay a verify_submission run against the real LLM + local D1
// and dump every raw model response. Usage: npx tsx scripts/probe-verify.ts
import { createLlmClient } from "../lib/agent/client"
import { VERIFY_SYSTEM_PROMPT, verifyUserPrompt } from "../lib/agent/prompts/verify"
import { toolDefinitionsFor, AGENT_TOOLS } from "../lib/agent/tools"
import { extractJson } from "../lib/agent/run"
import type { ChatMessage } from "../lib/agent/types"
import { openLocalD1 } from "./local-d1"

const TOOL_NAMES = ["searchWeb", "fetchPage", "findNearbyCafes", "draftCafeRecord"] as const

async function main() {
  const llm = createLlmClient()
  const db = openLocalD1()
  const input = {
    name: "TAF Coffee",
    location: "Emmanouil Benaki 7, Athens",
    note: "specialty coffee roastery",
  }
  const messages: ChatMessage[] = [
    { role: "system", content: VERIFY_SYSTEM_PROMPT },
    { role: "user", content: verifyUserPrompt(input) },
  ]

  for (let round = 0; round < 6; round += 1) {
    const resp = await llm.complete({
      system: VERIFY_SYSTEM_PROMPT,
      messages,
      tools: toolDefinitionsFor([...TOOL_NAMES]),
    })
    console.log(`\n=== round ${round} ===`)
    console.log("toolCalls:", resp.toolCalls.map((t) => `${t.name}(${t.arguments.slice(0, 80)})`))
    console.log("content:", JSON.stringify(resp.content)?.slice(0, 1500) ?? null)

    if (resp.toolCalls.length === 0) {
      console.log("\n=== extractJson on final content ===")
      console.log(JSON.stringify(extractJson(resp.content))?.slice(0, 2000))
      return
    }
    messages.push({ role: "assistant", content: resp.content, toolCalls: resp.toolCalls })
    for (const tc of resp.toolCalls) {
      const tool = AGENT_TOOLS[tc.name]
      let out: unknown
      try {
        out = await tool.execute(JSON.parse(tc.arguments), { db })
      } catch (e) {
        out = { error: String(e) }
      }
      const content = JSON.stringify(out)
      console.log(`  -> ${tc.name} result: ${content.slice(0, 120)}`)
      messages.push({ role: "tool", content, toolCallId: tc.id })
    }
  }
  console.log("exceeded rounds — forced final pass (no tools, jsonSchema)")
  const final = await llm.complete({ system: VERIFY_SYSTEM_PROMPT, messages })
  console.log("final content:", JSON.stringify(final.content)?.slice(0, 3000))
  console.log("final toolCalls:", final.toolCalls.length)
  console.log("extractJson:", JSON.stringify(extractJson(final.content))?.slice(0, 2000))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
