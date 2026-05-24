"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { CloudUpload, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ActivityCommandBar() {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    router.push(`/transactions?q=${encodeURIComponent(t)}`);
  }

  return (
    <div className="mb-10 rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Activity
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Command bar</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Jump to the ledger or start an import. Most day-to-day work happens here and on the
            dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" asChild>
            <Link href="/transactions">
              <Plus className="h-4 w-4" />
              New transaction
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href="#import-workspace">
              <CloudUpload className="h-4 w-4" />
              Import below
            </a>
          </Button>
        </div>
      </div>
      <form onSubmit={onSearch} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ledger… opens full table with filter"
            className="h-10 pl-9"
          />
        </div>
        <Button type="submit" variant="default" className="shrink-0 sm:w-auto">
          Go
        </Button>
      </form>
    </div>
  );
}
