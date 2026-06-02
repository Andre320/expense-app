import { NextResponse } from "next/server"
import type { ZodError } from "zod"

export const DEFAULT_API_ERROR_MESSAGE = "Something went wrong. Try again."

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function firstFlattenMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null
  const flat = error as {
    formErrors?: string[]
    fieldErrors?: Record<string, string[] | undefined>
  }
  if (flat.formErrors?.length) return flat.formErrors[0]
  for (const messages of Object.values(flat.fieldErrors ?? {})) {
    if (messages?.length) return messages[0]
  }
  return null
}

function firstZodMessage(zodError: ZodError): string {
  return firstFlattenMessage(zodError.flatten()) ?? "Validation failed"
}

export function validationErrorResponse(zodError: ZodError, options?: { includeFields?: boolean }) {
  const message = firstZodMessage(zodError)
  if (options?.includeFields) {
    const flat = zodError.flatten()
    const fields: Record<string, string[]> = {}
    for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
      if (msgs?.length) fields[key] = msgs
    }
    return NextResponse.json({ error: message, fields }, { status: 400 })
  }
  return errorResponse(message, 400)
}

function messageFromErrorBody(error: unknown): string | null {
  if (typeof error === "string" && error.length > 0) return error
  return firstFlattenMessage(error)
}

export async function parseApiError(res: Response): Promise<Error> {
  const text = await res.text()
  if (!text) return new Error(DEFAULT_API_ERROR_MESSAGE)

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return new Error(DEFAULT_API_ERROR_MESSAGE)
  }

  if (body && typeof body === "object" && "error" in body) {
    const message = messageFromErrorBody((body as { error: unknown }).error)
    if (message) return new Error(message)
  }

  return new Error(DEFAULT_API_ERROR_MESSAGE)
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw await parseApiError(res)
  return res.json() as Promise<T>
}
