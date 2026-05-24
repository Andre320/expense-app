"use client"

import Link from "next/link"
import { CategoriesManager } from "@/components/categories-manager"

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/settings?tab=categories"
        className="text-muted-foreground hover:text-foreground inline-block text-xs underline-offset-4 hover:underline"
      >
        ← Settings · Categories
      </Link>
      <CategoriesManager />
    </div>
  )
}
