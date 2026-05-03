import { NextResponse } from "next/server";
import { ensureAppDefaults, prisma } from "@/lib/db";
import { serializeSettings } from "@/lib/serialize";
import { settingsPatchZ } from "@/lib/validators";

export async function GET() {
  await ensureAppDefaults();
  const s = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });
  return NextResponse.json(serializeSettings(s));
}

export async function PATCH(req: Request) {
  await ensureAppDefaults();
  const json = await req.json().catch(() => null);
  const parsed = settingsPatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;
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
    },
  });
  return NextResponse.json(serializeSettings(updated));
}
