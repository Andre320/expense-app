import { z } from "zod"
import { transactionKindZ } from "./common"

export const categoryCreateZ = z.object({
  name: z.string().min(1).max(128),
  kind: transactionKindZ,
  color: z.string().max(32).optional(),
})

export const categoryUpdateZ = categoryCreateZ.partial()
