"use client"

import { FormSelect } from "@/components/form-select"
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
import { QUOTE_CURRENCY, REPORTING_CURRENCY } from "@/lib/shared/app-currency"
import type { UseMutationResult } from "@tanstack/react-query"
import type { UseFormReturn } from "react-hook-form"
import type { Category, FormValues } from "./use-transactions"

type TransactionFormProps = {
  form: UseFormReturn<FormValues>
  filteredCats: Category[]
  tags: { id: string; name: string }[] | undefined
  createMut: UseMutationResult<unknown, Error, FormValues, unknown>
}

export function TransactionForm({ form, filteredCats, tags, createMut }: TransactionFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New entry</CardTitle>
        <CardDescription>
          Keyboard friendly: Tab through fields. Amounts are always positive; kind determines flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
          >
            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormSelect
              control={form.control}
              name="kind"
              label="Kind"
              options={[
                { value: "EXPENSE", label: "Expense" },
                { value: "INCOME", label: "Income" },
              ]}
            />
            <FormSelect
              control={form.control}
              name="categoryId"
              label="Category"
              placeholder="—"
              options={[
                { value: "", label: "—" },
                ...filteredCats.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagNames"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. travel, tax-deductible" list="known-tags" {...field} />
                  </FormControl>
                  <datalist id="known-tags">
                    {(tags ?? []).map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amountOriginal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormSelect
              control={form.control}
              name="currencyCode"
              label="Currency"
              options={[
                { value: REPORTING_CURRENCY, label: REPORTING_CURRENCY },
                { value: QUOTE_CURRENCY, label: QUOTE_CURRENCY },
              ]}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={createMut.isPending}>
                Save entry
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
