import { createClient } from "@/lib/supabase/server"
import { resolveRedirectOrigin } from "@/lib/auth/redirect-origin"
import type { AuthProvider, Session } from "./types"

export class SupabaseAuthProvider implements AuthProvider {
  async getSession(): Promise<Session | null> {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single()

    return {
      user: {
        id: user.id,
        email: user.email ?? "",
        name:
          profile?.name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          null,
      },
    }
  }

  async signInWithGoogle(requestOrigin?: string): Promise<{ url?: string; error?: string }> {
    const supabase = await createClient()
    const origin = resolveRedirectOrigin(requestOrigin)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) return { error: error.message }
    if (data.url) return { url: data.url }
    return { error: "OAuth URL을 가져올 수 없습니다." }
  }

  async signOut(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
}
