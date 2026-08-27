"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type DateFieldOption = {
  id: string
  label: string
}

interface UniversalDateFilterProps {
  dateFields?: DateFieldOption[]
  defaultField?: string
}

const QUICK_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "this_week", label: "This Week" },
  { id: "last_week", label: "Last Week" },
  { id: "next_week", label: "Next Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "next_month", label: "Next Month" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "next_7_days", label: "Next 7 Days" },
  { id: "this_quarter", label: "This Quarter" },
  { id: "ytd", label: "Year to Date (YTD)" },
  { id: "this_year", label: "This Year" },
]

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export function UniversalDateFilter({
  dateFields = [{ id: "date", label: "Date" }],
  defaultField,
}: UniversalDateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = React.useState(false)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())

  const activeFieldId = searchParams.get("dateField") || defaultField || dateFields[0]?.id || "date"
  const activePreset = searchParams.get("datePreset")
  const activeFrom = searchParams.get("dateFrom")
  const activeTo = searchParams.get("dateTo")
  const activeMonth = searchParams.get("dateMonth")

  const [customFrom, setCustomFrom] = React.useState(activeFrom || "")
  const [customTo, setCustomTo] = React.useState(activeTo || "")

  const activeField = dateFields.find((f) => f.id === activeFieldId) || dateFields[0]

  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  // Active label computation
  let buttonLabel = "Date"
  const isDateActive = Boolean(activePreset || (activeFrom && activeTo) || activeMonth)

  if (activePreset) {
    const preset = QUICK_PRESETS.find((p) => p.id === activePreset)
    buttonLabel = `${activeField?.label || "Date"}: ${preset?.label || activePreset}`
  } else if (activeMonth) {
    buttonLabel = `${activeField?.label || "Date"}: ${activeMonth}`
  } else if (activeFrom && activeTo) {
    buttonLabel = `${activeField?.label || "Date"}: ${activeFrom} - ${activeTo}`
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customFrom || !customTo) return
    updateQueryParams({
      dateField: activeFieldId,
      datePreset: null,
      dateMonth: null,
      dateFrom: customFrom,
      dateTo: customTo,
    })
  }

  const handleSelectMonth = (monthIdx: number) => {
    const monthStr = `${MONTHS[monthIdx]} ${selectedYear}`
    updateQueryParams({
      dateField: activeFieldId,
      datePreset: null,
      dateFrom: null,
      dateTo: null,
      dateMonth: monthStr,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={isDateActive ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs font-normal"
          />
        }
      >
        <CalendarIcon className="size-3.5 text-muted-foreground" />
        <span className="font-medium truncate max-w-[150px]">{buttonLabel}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent className="w-[340px] p-3 text-xs" align="start">
        <div className="flex flex-col gap-3">
          {/* Header & Date Field Selector */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 text-primary" />
              Universal Date Engine
            </span>

            {dateFields.length > 1 ? (
              <select
                value={activeFieldId}
                onChange={(e) => updateQueryParams({ dateField: e.target.value })}
                className="h-7 rounded border bg-background px-2 text-[0.6875rem] font-medium"
              >
                {dateFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    Based on: {f.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-7 text-[0.6875rem]">
              <TabsTrigger value="presets">Quick</TabsTrigger>
              <TabsTrigger value="months">Months</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            {/* Quick Presets Tab */}
            <TabsContent value="presets" className="mt-2.5 space-y-1">
              <div className="grid grid-cols-2 gap-1 max-h-[220px] overflow-y-auto pr-1">
                {QUICK_PRESETS.map((p) => {
                  const isSelected = activePreset === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        updateQueryParams({
                          dateField: activeFieldId,
                          datePreset: p.id,
                          dateFrom: null,
                          dateTo: null,
                          dateMonth: null,
                        })
                      }
                      className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      {isSelected ? <Check className="size-3 shrink-0" /> : null}
                    </button>
                  )
                })}
              </div>
            </TabsContent>

            {/* Months Selector Tab */}
            <TabsContent value="months" className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-semibold">{selectedYear}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedYear((y) => y - 1)}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setSelectedYear((y) => y + 1)}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, idx) => {
                  const isSelected = activeMonth === `${m} ${selectedYear}`
                  return (
                    <button
                      key={m}
                      onClick={() => handleSelectMonth(idx)}
                      className={`rounded-md py-1.5 text-xs text-center border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium border-primary"
                          : "bg-card hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </TabsContent>

            {/* Custom Range Tab */}
            <TabsContent value="custom" className="mt-2.5">
              <form onSubmit={handleApplyCustom} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[0.625rem] text-muted-foreground">From</label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[0.625rem] text-muted-foreground">To</label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateQueryParams({
                        datePreset: null,
                        dateFrom: null,
                        dateTo: null,
                        dateMonth: null,
                      })
                    }
                    className="text-xs text-muted-foreground h-7"
                  >
                    Clear
                  </Button>
                  <Button type="submit" size="sm" className="h-7 text-xs">
                    Apply Range
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {isDateActive ? (
            <div className="border-t pt-2 flex items-center justify-between text-[0.6875rem] text-muted-foreground">
              <span>Filter active</span>
              <button
                onClick={() =>
                  updateQueryParams({
                    datePreset: null,
                    dateFrom: null,
                    dateTo: null,
                    dateMonth: null,
                  })
                }
                className="text-primary hover:underline"
              >
                Reset date filter
              </button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
