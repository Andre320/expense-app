import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { QueryProvider } from "@/components/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ledger — Expense & Forecast",
  description: "Local-first expense tracking and financial forecasting",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full font-sans antialiased">
        <QueryProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster richColors theme="dark" position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
