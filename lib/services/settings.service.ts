import "server-only";

import type { PrismaClient } from "@/app/generated/prisma/client";
import { serializeSettings } from "@/lib/serialize";
import { settingsPatchZ } from "@/lib/validators";
import type { z } from "zod";

export type SettingsPatch = z.infer<typeof settingsPatchZ>;

export async function getSerializedSettings(prisma: PrismaClient) {
  const s = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  return serializeSettings(s);
}

export async function patchSerializedSettings(
  prisma: PrismaClient,
  d: SettingsPatch,
) {
  const updated = await prisma.appSettings.update({
    where: { id: "default" },
    data: {
      ...(d.baseCurrency != null && { baseCurrency: d.baseCurrency.toUpperCase() }),
      ...(d.quoteCurrency != null && { quoteCurrency: d.quoteCurrency.toUpperCase() }),
      ...(d.quotePerBase != null && { quotePerBase: String(d.quotePerBase) }),
      ...(d.currentBalanceBase != null && {
        currentBalanceBase: String(d.currentBalanceBase),
      }),
      ...(d.monthlyIncomeBase != null && {
        monthlyIncomeBase: String(d.monthlyIncomeBase),
      }),
      ...(d.monthlyDeductionsBase != null && {
        monthlyDeductionsBase: String(d.monthlyDeductionsBase),
      }),
      ...(d.crCrcPerUsd != null && { crCrcPerUsd: String(d.crCrcPerUsd) }),
      ...(d.crSolidaristaPct != null && {
        crSolidaristaPct: String(d.crSolidaristaPct),
      }),
      ...(d.crPensionComplementariaPct != null && {
        crPensionComplementariaPct: String(d.crPensionComplementariaPct),
      }),
      ...(d.crEsppPct != null && { crEsppPct: String(d.crEsppPct) }),
    },
  });
  return serializeSettings(updated);
}
