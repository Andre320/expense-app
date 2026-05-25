import { z } from "zod"

export const knownStoreCreateZ = z.object({
  pattern: z.string().min(1).max(128),
  displayName: z.string().min(1).max(256),
  categoryId: z.string().min(1),
})

export const knownStoreUpdateZ = knownStoreCreateZ.partial()
