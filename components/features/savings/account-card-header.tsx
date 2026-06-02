"use client"

import { Trash2 } from "lucide-react"
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
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoneyBase } from "@/lib/shared/format-money"
import type { SavingsAccountDto } from "./savings-accounts-manager"

type AccountCardHeaderProps = {
  account: SavingsAccountDto
  deletePending: boolean
  onDelete: () => void
}

export function AccountCardHeader({ account, deletePending, onDelete }: AccountCardHeaderProps) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">{account.name}</CardTitle>
          <CardDescription className="tabular-nums">
            {formatMoneyBase(account.balance, account.currency || "CRC")} ·{" "}
            {account.currency || "CRC"}
          </CardDescription>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-400"
              aria-label="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove &ldquo;{account.name}&rdquo; and its movement history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={deletePending} onClick={onDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardHeader>
  )
}
