"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { PageIntro } from "@/components/patterns/page-intro"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesManager } from "@/components/categories-manager"
import { StoreMappingsPanel } from "@/components/store-mappings-panel"

const currencySchema = z.object({
  crCrcPerUsd: z.number().positive(),
})

type CurrencyForm = z.infer<typeof currencySchema>

type SettingsDto = CurrencyForm

async function fetchSettings(): Promise<SettingsDto> {
  const res = await fetch("/api/settings")
  if (!res.ok) throw new Error("settings")
  return res.json()
}

function SettingsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function SettingsPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const defaultTab =
    tabParam === "currency" || tabParam === "cr"
      ? "currency"
      : tabParam === "categories"
        ? "categories"
        : tabParam === "stores"
          ? "stores"
          : "currency"

  const qc = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

  const currencyForm = useForm<CurrencyForm>({
    resolver: zodResolver(currencySchema),
    values: data ? { crCrcPerUsd: data.crCrcPerUsd } : undefined,
  })

  const mut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("fail")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Saved")
      qc.invalidateQueries({ queryKey: ["settings"] })
      qc.invalidateQueries({ queryKey: ["analytics"] })
    },
    onError: () => toast.error("Save failed"),
  })

  if (isPending || !data) {
    return <SettingsLoading />
  }

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Configuration"
        title="Settings"
        description="Exchange rate for USD conversions. Salary and optional payroll deductions are on the Income tab; categories and store maps organize Activity imports."
      />

      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
        <TabsList className="flex h-auto min-h-9 w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="currency" className="shrink-0">
            Currency
          </TabsTrigger>
          <TabsTrigger value="categories" className="shrink-0">
            Categories
          </TabsTrigger>
          <TabsTrigger value="stores" className="shrink-0">
            Store maps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>USD exchange rate</CardTitle>
              <CardDescription>
                All amounts are tracked in <strong>CRC</strong>. Enter how many colones equal{" "}
                <strong>1 US dollar</strong> — used when salary or ledger entries are in USD, and
                for the Income calculator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...currencyForm}>
                <form
                  className="grid max-w-xl gap-4"
                  onSubmit={currencyForm.handleSubmit((v) => mut.mutate(v))}
                >
                  <FormField
                    control={currencyForm.control}
                    name="crCrcPerUsd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CRC per 1 USD</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={mut.isPending}>
                    Save rate
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <CategoriesManager embedded />
        </TabsContent>

        <TabsContent value="stores" className="space-y-6">
          <StoreMappingsPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </Suspense>
  )
}
