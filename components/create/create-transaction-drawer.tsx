"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, Loader2, Plus, Receipt, Sparkles, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { createTransactionAction } from "@/lib/actions/entities"

interface CreateTransactionDrawerProps {
  workspace: string
  trigger?: React.ReactNode
}

export function CreateTransactionDrawer({
  workspace,
  trigger,
}: CreateTransactionDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    const res = await createTransactionAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to record transaction")
    } else {
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 600)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={<span className="inline-flex cursor-pointer" />} nativeButton={false}>
          {trigger}
        </SheetTrigger>
      ) : (
        <SheetTrigger
          render={
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground font-medium" />
          }
        >
          <Plus className="size-3.5" />
          <span>New Transaction</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Receipt className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Record Financial Ledger Entry
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Exact paise-level accounting entry across business, client invoices, or personal expenses.
              </SheetDescription>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Transaction recorded to ledger!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center gap-1">
                Transaction Description <span className="text-destructive">*</span>
              </label>
              <Input
                name="description"
                required
                placeholder="e.g. Client Payment - GB Banquet Sprint 1"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  Amount (₹) <span className="text-destructive">*</span>
                </label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="25000.00"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Direction</label>
                <select
                  name="direction"
                  defaultValue="DEBIT"
                  className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="DEBIT">Debit (Expense / Outflow)</option>
                  <option value="CREDIT">Credit (Income / Revenue)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Category</label>
                <select
                  name="category"
                  defaultValue="EXPENSE"
                  className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="INVOICE">Client Invoice / Revenue</option>
                  <option value="EXPENSE">General Expense</option>
                  <option value="SUBSCRIPTION">Software Subscription</option>
                  <option value="HARDWARE">Hardware / Gear</option>
                  <option value="TAX">Tax &amp; Government</option>
                  <option value="PERSONAL">Personal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Transaction Date</label>
                <Input
                  name="occurredAt"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Client Association (Optional)</label>
              <Input
                name="organizationId"
                placeholder="Paste Organization / Client ID"
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span>
                Personal OS automatically reconciles manual transactions with bank statements and subscription rules.
              </span>
            </div>
          </div>

          {/* Sticky Bottom Footer */}
          <div className="mt-auto border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              Press Enter to create
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                size="sm"
                className="text-xs h-8 px-4 font-medium shadow-xs"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-3.5 mr-1" />
                    Record Transaction
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
