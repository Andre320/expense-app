"use client"

import * as React from "react"
import type { UseMutationResult } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { InsetPanel } from "@/components/patterns/inset-panel"
import { SelectField } from "@/components/select-field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export type Category = {
  id: string
  name: string
  kind: "INCOME" | "EXPENSE"
  color: string | null
  position: number
}

export const KIND_OPTIONS = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
] as const

type PatchBody = Partial<{ name: string; kind: "INCOME" | "EXPENSE"; color: string | null }>
export type PatchMut = UseMutationResult<unknown, Error, { id: string; body: PatchBody }, unknown>
export type DeleteMut = UseMutationResult<void, Error, string, unknown>

export function CategoryTable({
  title,
  rows,
  patchMut,
  deleteMut,
}: {
  title: string
  rows: Category[]
  patchMut: PatchMut
  deleteMut: DeleteMut
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {rows.length} categor{rows.length === 1 ? "y" : "ies"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <InsetPanel>
            <p className="text-muted-foreground text-xs">None yet.</p>
          </InsetPanel>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <CategoryRow
                  key={`${c.id}-${c.name}-${c.kind}-${c.color ?? ""}`}
                  c={c}
                  patchMut={patchMut}
                  deleteMut={deleteMut}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryRow({
  c,
  patchMut,
  deleteMut,
}: {
  c: Category
  patchMut: PatchMut
  deleteMut: DeleteMut
}) {
  const [name, setName] = React.useState(c.name)
  const [kind, setKind] = React.useState(c.kind)
  const [color, setColor] = React.useState(c.color ?? "#6366f1")

  const locked = c.name === "Uncategorized" && c.kind === "EXPENSE"

  function saveName() {
    const t = name.trim()
    if (!t || t === c.name) return
    patchMut.mutate({ id: c.id, body: { name: t } })
  }

  function saveColor() {
    if (color === (c.color ?? "#6366f1")) return
    patchMut.mutate({ id: c.id, body: { color } })
  }

  return (
    <TableRow>
      <TableCell className="py-2">
        <input
          type="color"
          className="h-8 w-full max-w-[36px] cursor-pointer rounded border-0 bg-transparent p-0"
          value={color}
          disabled={locked}
          onChange={(e) => setColor(e.target.value)}
          onBlur={saveColor}
        />
      </TableCell>
      <TableCell className="py-2">
        <Input
          className="h-8 text-xs"
          value={name}
          disabled={locked}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
        />
      </TableCell>
      <TableCell className="py-2">
        {locked ? (
          <Badge variant="default">Expense</Badge>
        ) : (
          <SelectField
            value={kind}
            onValueChange={(v) => {
              const val = v as "INCOME" | "EXPENSE"
              if (val === c.kind) return
              setKind(val)
              patchMut.mutate({ id: c.id, body: { kind: val } })
            }}
            options={[...KIND_OPTIONS]}
            size="sm"
            triggerClassName="max-w-[120px] text-xs"
          />
        )}
      </TableCell>
      <TableCell className="py-2">
        {!locked && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete category"
                disabled={deleteMut.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &ldquo;{c.name}&rdquo;. Transactions using this category may need
                  to be recategorized.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => deleteMut.mutate(c.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  )
}
