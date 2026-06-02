"use client"

import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { TransactionForm } from "./transaction-form"
import { TransactionTable } from "./transaction-table"
import { useTransactionsPage } from "./use-transactions"

export function TransactionsPage() {
  const {
    page,
    setPage,
    sorting,
    setSorting,
    kindFilter,
    setKindFilter,
    q,
    setQ,
    data,
    isPending,
    isError,
    error,
    refetch,
    categoriesIsError,
    categoriesError,
    refetchCategories,
    form,
    filteredCats,
    tags,
    createMut,
    deleteMut,
  } = useTransactionsPage()

  return (
    <div className="space-y-8">
      <PageIntro
        title="Ledger"
        description="Manual entries in CRC with USD equivalent. Sort columns and page through history."
      />

      {categoriesIsError ? (
        <QueryErrorPanel
          title="Could not load categories"
          message={categoriesError?.message ?? "Categories are unavailable."}
          onRetry={() => void refetchCategories()}
        />
      ) : null}

      <TransactionForm form={form} filteredCats={filteredCats} tags={tags} createMut={createMut} />

      <TransactionTable
        data={data}
        isPending={isPending}
        isError={isError}
        errorMessage={error?.message}
        onRetry={() => void refetch()}
        sorting={sorting}
        onSortingChange={setSorting}
        kindFilter={kindFilter}
        onKindFilterChange={setKindFilter}
        q={q}
        onQChange={setQ}
        page={page}
        onPageChange={setPage}
        deleteMut={deleteMut}
      />
    </div>
  )
}
