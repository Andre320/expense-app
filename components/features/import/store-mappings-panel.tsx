"use client"

import Link from "next/link"
import { PageIntro } from "@/components/patterns/page-intro"
import { QueryErrorPanel } from "@/components/patterns/query-error-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StoreMappingsForm } from "./store-mappings-form"
import { StoreMappingsTable } from "./store-mappings-table"
import { useStoreMappings } from "./use-store-mappings"

export function StoreMappingsPanel({ embedded }: { embedded?: boolean }) {
  const {
    stores,
    isPending,
    isError,
    error,
    refetch,
    categoriesIsError,
    categoriesError,
    refetchCategories,
    categoryOptions,
    pattern,
    setPattern,
    displayName,
    setDisplayName,
    categoryId,
    setCategoryId,
    createMut,
    deleteMut,
  } = useStoreMappings()

  return (
    <div className="space-y-8">
      {!embedded ? (
        <PageIntro
          title="Store mappings"
          description={
            <>
              Match substrings in bank descriptions (e.g. <code className="text-[11px]">MXM</code>)
              to a clean name and expense category. Used automatically on BAC PDF import.
            </>
          }
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">← Settings</Link>
            </Button>
          }
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          Patterns match case-insensitive on import. Expense categories come from your category
          list.
        </p>
      )}

      {categoriesIsError ? (
        <QueryErrorPanel
          title="Could not load categories"
          message={categoriesError?.message ?? "Categories are unavailable for mapping."}
          onRetry={() => void refetchCategories()}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Add mapping</CardTitle>
          <CardDescription>
            Pattern is matched case-insensitive anywhere in the concepto. Longer patterns take
            priority over shorter ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreMappingsForm
            pattern={pattern}
            displayName={displayName}
            categoryId={categoryId}
            categoryOptions={categoryOptions}
            isPending={createMut.isPending}
            onPatternChange={setPattern}
            onDisplayNameChange={setDisplayName}
            onCategoryChange={setCategoryId}
            onSubmit={() => createMut.mutate()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current mappings</CardTitle>
          <CardDescription>{stores?.length ?? 0} rule(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <StoreMappingsTable
            stores={stores}
            isPending={isPending}
            isError={isError}
            errorMessage={error?.message}
            onRetry={() => void refetch()}
            onDelete={(id) => deleteMut.mutate(id)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
