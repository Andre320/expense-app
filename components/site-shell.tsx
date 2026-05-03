"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CloudUpload,
  LayoutDashboard,
  PiggyBank,
  Settings2,
  Table2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/transactions", label: "Ledger", icon: Table2 },
  { href: "/import", label: "Import", icon: CloudUpload },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] px-3 py-5">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--muted)]">
            <ArrowLeftRight className="h-4 w-4 text-[var(--foreground)]" />
          </div>
          <div>
            <div className="text-xs font-semibold tracking-tight">Ledger</div>
            <div className="text-[10px] text-[var(--muted-fg)]">Local workspace</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                  active
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-fg)] hover:bg-[var(--muted)]/60 hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Separator className="my-4 bg-[var(--border)]" />
        <p className="px-2 text-[10px] leading-relaxed text-[var(--muted-fg)]">
          Data stays on this device. SQLite + Prisma.
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
