import "server-only";

import type { PrismaClient } from "@/app/generated/prisma/client";
import { serializeSavings } from "@/lib/serialize";
import { savingsCreateZ } from "@/lib/validators";
import type { z } from "zod";

type SavingsCreate = z.infer<typeof savingsCreateZ>;

export async function listSerializedSavingsGoals(prisma: PrismaClient) {
  const goals = await prisma.savingsGoal.findMany({
    orderBy: [{ priorityOrder: "asc" }, { name: "asc" }],
  });
  return goals.map(serializeSavings);
}

export async function createSavingsGoal(prisma: PrismaClient, d: SavingsCreate) {
  const maxPos = await prisma.savingsGoal.aggregate({ _max: { priorityOrder: true } });
  const nextDefault = (maxPos._max.priorityOrder ?? 0) + 1;
  const priorityOrder = d.priorityOrder ?? nextDefault;
  const created = await prisma.savingsGoal.create({
    data: {
      name: d.name,
      targetAmount: d.targetAmount == null ? null : String(d.targetAmount),
      currentAmount: String(d.currentAmount ?? 0),
      color: d.color,
      notes: d.notes,
      priorityOrder,
    },
  });
  return serializeSavings(created);
}
