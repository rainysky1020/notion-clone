import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const publicPaths = ["/login", "/auth/callback"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const { supabaseResponse, user } = await updateSession(request)

  if (isPublic && user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.svg$).*)"],
}
