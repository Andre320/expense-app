"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatMoneyBase } from "@/lib/format-money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Tx = {
  id: string;
  occurredAt: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  category: { name: string } | null;
  amountBase: number;
};

async function fetchRecent(baseCurrency: string) {
  const params = new URLSearchParams({
    page: "1",
    pageSize: "12",
    sortBy: "occurredAt",
    sortDir: "desc",
  });
  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) throw new Error("tx");
  const j = (await res.json()) as { items: Tx[] };
  return { items: j.items, baseCurrency };
}

export function RecentLedger({ baseCurrency }: { baseCurrency: string }) {
  const { data, isPending } = useQuery({
    queryKey: ["transactions", "recent-dashboard", baseCurrency],
    queryFn: () => fetchRecent(baseCurrency),
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }
  if (!data?.items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No transactions yet. Use <Link href="/activity" className="underline-offset-2 hover:underline">Activity</Link> to import or add rows.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent ledger
        </p>
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href="/transactions">Full ledger</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Date</TableHead>
            <TableHead className="text-xs">Description</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-right text-xs">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {format(new Date(t.occurredAt), "MMM d")}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs">
                {t.description || "—"}
                {t.category ? (
                  <span className="ml-1 text-[10px] text-muted-foreground">· {t.category.name}</span>
                ) : null}
              </TableCell>
              <TableCell>
                <Badge variant={t.kind === "INCOME" ? "success" : "default"} className="text-[10px]">
                  {t.kind === "INCOME" ? "In" : "Out"}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {formatMoneyBase(t.amountBase, baseCurrency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
