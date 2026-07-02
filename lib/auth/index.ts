import { SupabaseAuthProvider } from "./providers/supabase"
import type { AuthProvider } from "./types"

let authProvider: AuthProvider | null = null

export function getAuthProvider(): AuthProvider {
  if (!authProvider) {
    authProvider = new SupabaseAuthProvider()
  }
  return authProvider
}

export async function requireSession() {
  const session = await getAuthProvider().getSession()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
