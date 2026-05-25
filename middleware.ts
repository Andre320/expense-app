import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return Response.redirect(new URL("/", req.nextUrl))
  }

  if (!isLoggedIn && !isAuthRoute) {
    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const login = new URL("/login", req.nextUrl.origin)
    login.searchParams.set("callbackUrl", pathname)
    return Response.redirect(login)
  }

  return undefined
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
