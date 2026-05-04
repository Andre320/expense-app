"use client";

import Link from "next/link";
import { CategoriesManager } from "@/components/categories-manager";

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/settings?tab=categories"
        className="inline-block text-xs text-[var(--muted-fg)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
      >
        ← Settings · Categories
      </Link>
      <CategoriesManager />
    </div>
  );
}
