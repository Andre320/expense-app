"use client"

export type { Category, FormValues, Tx } from "./use-transactions-queries"
export { useTransactionQueries } from "./use-transactions-queries"
export { useTransactionMutations } from "./use-transactions-mutations"

import { useTransactionMutations } from "./use-transactions-mutations"
import { useTransactionQueries } from "./use-transactions-queries"

export function useTransactionsPage() {
  const queries = useTransactionQueries()
  const mutations = useTransactionMutations(queries.form)

  return {
    ...queries,
    ...mutations,
  }
}
