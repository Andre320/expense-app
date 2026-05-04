"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CloudUpload, LayoutDashboard, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: Sparkles },
  { href: "/activity", label: "Activity", icon: CloudUpload },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="sticky top-0 flex h-screen w-52 shrink-0 flex-col border-r border-[var(--border)]/80 bg-[var(--card)]/80 px-4 py-8 backdrop-blur-sm sm:w-56">
        <Link href="/" className="mb-10 flex items-center gap-2.5 px-1 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--muted)]">
            <ArrowLeftRight className="h-4 w-4 text-[var(--foreground)]" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Expense</div>
            <div className="text-[10px] text-[var(--muted-fg)]">Local workspace</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href === "/settings"
                  ? pathname === "/settings" || pathname.startsWith("/settings/")
                  : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--muted)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-fg)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-85" />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-1 pt-8 text-[10px] leading-relaxed text-[var(--muted-fg)]">
          SQLite + Prisma · data stays on device
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">{children}</main>
      </div>
    </div>
  );
}
