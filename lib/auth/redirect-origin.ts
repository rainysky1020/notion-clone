function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "")
}

export function resolveRedirectOrigin(requestOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (configured) return configured

  if (requestOrigin) {
    try {
      const url = new URL(requestOrigin)
      const origin = normalizeOrigin(url.origin)

      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return origin
      }

      if (url.hostname.endsWith(".vercel.app")) {
        return origin
      }
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000"
}
