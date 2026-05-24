import { roundMoney } from "./currency"
import { settleVestReceive } from "./rsu-vesting"

export type VestProjection = {
  grossShares: number
  netWholeShares: number
  cashBonusUsd: number
  netUsd: number
  priceUsd: number
}

export function projectVestValue(
  grossShares: number,
  taxWithholdPct: number,
  priceUsd: number,
): VestProjection {
  const settlement = settleVestReceive(grossShares, taxWithholdPct, priceUsd)
  const netUsd = roundMoney(settlement.netWholeShares * priceUsd + settlement.cashBonusUsd)
  return {
    grossShares: settlement.grossShares,
    netWholeShares: settlement.netWholeShares,
    cashBonusUsd: settlement.cashBonusUsd,
    netUsd,
    priceUsd,
  }
}

export type VestScenarioProjection = {
  bear: VestProjection
  base: VestProjection
  bull: VestProjection
}

export function projectVestScenarios(
  grossShares: number,
  taxWithholdPct: number,
  prices: { bear: number; base: number; bull: number },
): VestScenarioProjection {
  return {
    bear: projectVestValue(grossShares, taxWithholdPct, prices.bear),
    base: projectVestValue(grossShares, taxWithholdPct, prices.base),
    bull: projectVestValue(grossShares, taxWithholdPct, prices.bull),
  }
}
