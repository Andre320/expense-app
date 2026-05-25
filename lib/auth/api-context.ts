import "server-only"

import { getSessionUserId, unauthorizedResponse } from "@/lib/auth/require-user"
import { ensureUserDefaults } from "@/lib/auth/onboarding"

export async function apiRequireUser() {
  const userId = await getSessionUserId()
  if (!userId) return { userId: null as null, response: unauthorizedResponse() }
  await ensureUserDefaults(userId)
  return { userId, response: null as null }
}

export function notFoundResponse(message = "Not found") {
  return Response.json({ error: message }, { status: 404 })
}
