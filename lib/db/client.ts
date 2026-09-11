import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const isServer = typeof window === "undefined"

function getPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    )
  }
  return { url, anonKey }
}

// Anon client. RLS restricts it to public data (verified cafes + scores)
// and submission inserts. Safe to use in browser and server code.
export function createAnonClient(): SupabaseClient {
  const { url, anonKey } = getPublicEnv()
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  })
}

// Service-role client. Bypasses RLS, so it is server-only and must be
// treated as an admin handle: never imported by client components.
export function createAdminClient(): SupabaseClient {
  const { url } = getPublicEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be set (server-side admin operations)",
    )
  }
  if (!isServer) {
    throw new Error("createAdminClient() cannot be used in the browser")
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })
}
