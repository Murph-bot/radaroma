import { vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

// Minimal chainable mock of the supabase-js query builder.
// The chain is a thenable that resolves to the configured result, like the
// real supabase-js PostgrestBuilder.
// Usage:
//   const { client, setResult } = mockSupabase()
//   setResult({ data: [...], error: null })
export function mockSupabase() {
  const result: { data: unknown; error: unknown } = { data: null, error: null }
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    in: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    insert: vi.fn(() => q),
    update: vi.fn(() => q),
    upsert: vi.fn(() => q),
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  }
  const client = { from: vi.fn(() => q) } as unknown as SupabaseClient
  return {
    client,
    q,
    setResult: (r: { data: unknown; error: unknown }) => {
      result.data = r.data
      result.error = r.error
    },
  }
}
