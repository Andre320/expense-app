import { Suspense } from "react"
import LoginPageClient from "./login-client"

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-center text-sm">Loading…</p>}>
      <LoginPageClient />
    </Suspense>
  )
}
