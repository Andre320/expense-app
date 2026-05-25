import "server-only"

import { auth } from "@/auth"
import { NextResponse } from "next/server"

export class UnauthorizedError extends Error {
  readonly status = 401
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId()
  if (!userId) {
    throw new UnauthorizedError("Unauthorized")
  }
  return userId
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function withUser<T>(
  handler: (userId: string) => Promise<T>,
): Promise<T | NextResponse> {
  try {
    const userId = await requireUserId()
    return await handler(userId)
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorizedResponse()
    }
    throw error
  }
}
