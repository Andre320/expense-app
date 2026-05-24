"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  CloudUpload,
  LayoutDashboard,
  PiggyBank,
  Settings2,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: Sparkles },
  { href: "/savings", label: "Savings", icon: PiggyBank },
  { href: "/stocks", label: "Stocks", icon: TrendingUp },
  { href: "/activity", label: "Activity", icon: CloudUpload },
  { href: "/settings", label: "Settings", icon: Settings2 },
]

function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-accent text-sidebar-accent-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ArrowLeftRight className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Expense</span>
                  <span className="text-muted-foreground truncate text-xs">Local workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map(({ href, label, icon: Icon }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : href === "/settings"
                      ? pathname === "/settings" || pathname.startsWith("/settings/")
                      : pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <p className="text-muted-foreground px-2 py-2 text-[10px] leading-relaxed">
          SQLite + Prisma · data stays on device
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <header className="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">Expense</span>
        </header>
        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
