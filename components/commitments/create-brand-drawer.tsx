"use client"

import { useState } from "react"
import { Building2 } from "lucide-react"
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
import { createBrandAction } from "@/app/w/[workspace]/commitments/actions"

export function CreateBrandDrawer({
  workspace,
  organizations,
}: {
  workspace: string
  organizations: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    try {
      const res = await createBrandAction(workspace, formData)
      if (!res.success) {
        setError(res.error || "Failed to create brand")
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
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 text-xs"
      >
        <Building2 className="size-3.5" />
        <span>New Brand / Account</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[90vw] max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-indigo-500" />
              Add Client Brand / Account
            </SheetTitle>
            <SheetDescription className="text-xs">
              Model sub-accounts under your paying client (e.g. WOW Indian under Karna Kreative).
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="p-4 space-y-3.5 flex-1 overflow-y-auto">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Parent Client (Agency / Commercial Entity)</Label>
              <select
                name="organizationId"
                className="w-full rounded-md border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary"
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
              <Label className="text-xs">Brand / Business Name</Label>
              <Input
                name="name"
                placeholder="e.g. WOW Indian, Restaurant B, Brand X"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Industry</Label>
              <Input
                name="industry"
                placeholder="e.g. Hospitality / Food & Bev"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Website</Label>
              <Input
                name="website"
                placeholder="https://example.com"
                className="h-8 text-xs"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} size="sm" className="w-full h-8 text-xs">
                {loading ? "Creating..." : "Save Brand / Account"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
