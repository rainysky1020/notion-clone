export type AuthUser = {
  id: string
  email: string
  name: string | null
}

export type Session = {
  user: AuthUser
}

export type AuthProvider = {
  signInWithGoogle(): Promise<{ url?: string; error?: string }>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
}
