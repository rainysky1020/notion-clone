"use server"

import { redirect } from "next/navigation"
import { getAuthProvider } from "@/lib/auth"

export async function signInWithGoogleAction() {
  const result = await getAuthProvider().signInWithGoogle()
  return result
}

export async function signOutAction() {
  await getAuthProvider().signOut()
  redirect("/login")
}
