"use client"

import { IncomeBonusFormCard } from "@/components/features/income/income-bonus-form-card"
import { IncomeBonusListCard } from "@/components/features/income/income-bonus-list-card"
import { useIncomeBonuses } from "@/components/features/income/use-income-bonuses"

export type { IncomeBonusDto } from "@/components/features/income/income-bonus-types"
export { MONTH_LABELS } from "@/components/features/income/income-bonus-types"

type IncomeBonusesManagerProps = {
  crcPerUsd?: number
  embedded?: boolean
}

export function IncomeBonusesManager({ crcPerUsd = 505, embedded }: IncomeBonusesManagerProps) {
  const bonuses = useIncomeBonuses()

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header>
          <h2 className="text-lg font-semibold tracking-tight">Fixed bonuses</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Gross amounts applied in selected months each year. Taxed together with salary that
            month.
          </p>
        </header>
      ) : null}

      <IncomeBonusFormCard {...bonuses} />
      <IncomeBonusListCard
        sorted={bonuses.sorted}
        isPending={bonuses.isPending}
        isError={bonuses.isError}
        errorMessage={bonuses.error?.message}
        onRetry={() => void bonuses.refetch()}
        crcPerUsd={crcPerUsd}
        deleteMut={bonuses.deleteMut}
      />
    </div>
  )
}
