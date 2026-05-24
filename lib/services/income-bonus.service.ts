import "server-only";

import type { PrismaClient } from "@/app/generated/prisma/client";
import { stringifyBonusMonths } from "@/lib/income-bonus";
import { serializeIncomeBonus } from "@/lib/serialize";
import { incomeBonusCreateZ } from "@/lib/validators";
import type { z } from "zod";

type IncomeBonusCreate = z.infer<typeof incomeBonusCreateZ>;
type IncomeBonusUpdate = Partial<IncomeBonusCreate>;

export async function listSerializedIncomeBonuses(prisma: PrismaClient) {
  const rows = await prisma.incomeBonus.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return rows.map(serializeIncomeBonus);
}

export async function createIncomeBonus(prisma: PrismaClient, d: IncomeBonusCreate) {
  const maxPos = await prisma.incomeBonus.aggregate({ _max: { position: true } });
  const nextDefault = (maxPos._max.position ?? 0) + 1;
  const position = d.position ?? nextDefault;
  const created = await prisma.incomeBonus.create({
    data: {
      name: d.name,
      grossAmount: String(d.grossAmount),
      grossCurrency: d.grossCurrency ?? "CRC",
      months: stringifyBonusMonths(d.months),
      position,
    },
  });
  return serializeIncomeBonus(created);
}

export async function updateIncomeBonus(
  prisma: PrismaClient,
  id: string,
  d: IncomeBonusUpdate,
) {
  const updated = await prisma.incomeBonus.update({
    where: { id },
    data: {
      ...(d.name != null && { name: d.name }),
      ...(d.grossAmount != null && { grossAmount: String(d.grossAmount) }),
      ...(d.grossCurrency != null && { grossCurrency: d.grossCurrency }),
      ...(d.months != null && { months: stringifyBonusMonths(d.months) }),
      ...(d.position != null && { position: d.position }),
    },
  });
  return serializeIncomeBonus(updated);
}

export async function deleteIncomeBonus(prisma: PrismaClient, id: string) {
  await prisma.incomeBonus.delete({ where: { id } });
}
