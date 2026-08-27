"use client"

import { useState } from "react"
import { Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCommitmentAction } from "@/app/w/[workspace]/commitments/actions"

export function CreateCommitmentDrawer({
  workspace,
  organizations,
  brands,
}: {
  workspace: string
  organizations: Array<{ id: string; name: string }>
  brands: Array<{ id: string; name: string; organizationId: string }>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || "")

  const filteredBrands = brands.filter((b) => b.organizationId === selectedOrgId)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await createCommitmentAction(workspace, formData)
      if (!res.success) {
        setError(res.error || "Failed to create commitment")
      } else {
        setOpen(false)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 text-xs font-medium"
      >
        <Plus className="size-3.5" />
        <span>New Recurring Commitment</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[90vw] max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-base flex items-center gap-2">
              <Layers className="size-4 text-indigo-500" />
              New Recurring Commitment / Retainer
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure ongoing service deliverables (e.g. 3 Reels/week for WOW Indian under Karna Kreative).
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 flex-1 overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Client (Commercial Entity)</Label>
                <select
                  name="organizationId"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                  required
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Brand / Sub-Account</Label>
                <select
                  name="brandId"
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="">(None / Direct Client)</option>
                  {filteredBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Commitment Title</Label>
              <Input
                name="title"
                placeholder="e.g. Weekly Social Reels & Shorts"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Deliverable Type</Label>
                <select
                  name="deliverableType"
                  defaultValue="REEL"
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="REEL">Reel</option>
                  <option value="POST">Post</option>
                  <option value="SHORT">Short</option>
                  <option value="STORY">Story</option>
                  <option value="REPORT">Report</option>
                  <option value="DESIGN">Design</option>
                  <option value="NEWSLETTER">Newsletter</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  name="quantity"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="3"
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <select
                  name="frequency"
                  defaultValue="WEEKLY"
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Est. Time per Item (Minutes)</Label>
                <Input
                  name="estimatedMinutes"
                  type="number"
                  min="5"
                  defaultValue="45"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <select
                  name="priority"
                  defaultValue="HIGH"
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} size="sm" className="w-full h-8 text-xs font-medium">
                {loading ? "Creating..." : "⚡ Save & Generate Cycle Tasks"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
