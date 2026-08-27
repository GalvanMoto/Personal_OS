"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDownUp,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Filter,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import type {
  FilterField,
  GroupOption,
  SmartPreset,
  SortOption,
} from "./filter-types"
import {
  UniversalDateFilter,
  type DateFieldOption,
} from "./universal-date-filter"

interface UniversalFilterBarProps {
  searchPlaceholder?: string
  dateFields?: DateFieldOption[]
  enableDateFilter?: boolean
  quickFilters?: FilterField[]
  advancedFilters?: FilterField[]
  presets?: SmartPreset[]
  sortOptions?: SortOption[]
  groupOptions?: GroupOption[]
}

export function UniversalFilterBar({
  searchPlaceholder = "Search and filter...",
  dateFields,
  enableDateFilter = true,
  quickFilters = [],
  advancedFilters = [],
  presets = [],
  sortOptions = [],
  groupOptions = [],
}: UniversalFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get("q") || ""
  )
  const [drawerOpen, setDrawerOpen] = React.useState(false)

  // Sync search input with URL
  React.useEffect(() => {
    setSearchTerm(searchParams.get("q") || "")
  }, [searchParams])

  const updateQueryParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateQueryParams({ q: searchTerm.trim() || null })
  }

  const handleClearAll = () => {
    router.push(pathname, { scroll: false })
  }

  // Identify active filters
  const allFields = [...quickFilters, ...advancedFilters]
  const activeFilters: Array<{ key: string; label: string; valueLabel: string }> =
    []

  searchParams.forEach((value, key) => {
    if (
      key === "q" ||
      key === "sort" ||
      key === "group" ||
      key === "dateField" ||
      key === "datePreset" ||
      key === "dateFrom" ||
      key === "dateTo" ||
      key === "dateMonth"
    )
      return
    const field = allFields.find((f) => f.id === key)
    const opt = field?.options?.find((o) => o.value === value)
    activeFilters.push({
      key,
      label: field?.label || key,
      valueLabel: opt?.label || value,
    })
  })

  // Date filter active check
  const activeDatePreset = searchParams.get("datePreset")
  const activeDateFrom = searchParams.get("dateFrom")
  const activeDateTo = searchParams.get("dateTo")
  const activeDateMonth = searchParams.get("dateMonth")
  const activeDateField = searchParams.get("dateField")

  const dateLabel =
    activeDatePreset
      ? activeDatePreset.replace("_", " ")
      : activeDateMonth
      ? activeDateMonth
      : activeDateFrom && activeDateTo
      ? `${activeDateFrom} → ${activeDateTo}`
      : null

  const currentSort = searchParams.get("sort")
  const currentGroup = searchParams.get("group")
  const activeSort = sortOptions.find((s) => s.value === currentSort)
  const activeGroup = groupOptions.find((g) => g.value === currentGroup)

  return (
    <div className="flex flex-col gap-2.5">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-2 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative min-w-[180px] max-w-xs flex-1"
          >
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs bg-muted/30 focus-visible:bg-background"
            />
          </form>

          {/* Universal Date Engine Filter */}
          {enableDateFilter ? (
            <UniversalDateFilter dateFields={dateFields} />
          ) : null}

          {/* Quick Filters */}
          {quickFilters.map((field) => {
            const currentValue = searchParams.get(field.id)
            const activeOpt = field.options?.find((o) => o.value === currentValue)

            return (
              <Popover key={field.id}>
                <PopoverTrigger
                  render={
                    <Button
                      variant={currentValue ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-xs font-normal"
                    />
                  }
                >
                  <span>{field.label}:</span>
                  <span className="font-medium">
                    {activeOpt?.label || currentValue || "All"}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1 text-xs" align="start">
                  <div className="flex flex-col">
                    <button
                      onClick={() => updateQueryParams({ [field.id]: null })}
                      className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-muted text-left"
                    >
                      <span>All</span>
                      {!currentValue ? <Check className="size-3" /> : null}
                    </button>
                    {field.options?.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateQueryParams({ [field.id]: opt.value })
                        }
                        className="flex items-center justify-between rounded-sm px-2 py-1.5 hover:bg-muted text-left"
                      >
                        <span className="truncate">{opt.label}</span>
                        {currentValue === opt.value ? (
                          <Check className="size-3" />
                        ) : opt.count !== undefined ? (
                          <span className="text-[0.625rem] text-muted-foreground">
                            {opt.count}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )
          })}

          {/* Advanced Drawer Trigger */}
          {advancedFilters.length > 0 ? (
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-normal"
                  />
                }
              >
                <SlidersHorizontal className="size-3" />
                <span>+ Filters</span>
                {activeFilters.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-0.5 size-4 rounded-full p-0 text-[0.625rem] flex items-center justify-center"
                  >
                    {activeFilters.length}
                  </Badge>
                ) : null}
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-base flex items-center gap-2">
                    <Filter className="size-4" />
                    Advanced Filters
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Narrow down your records with precision multi-attribute criteria.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 flex flex-col gap-5 text-xs">
                  {allFields.map((field) => {
                    const currentValue = searchParams.get(field.id)
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <label className="font-semibold text-foreground">
                          {field.label}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() =>
                              updateQueryParams({ [field.id]: null })
                            }
                            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                              !currentValue
                                ? "bg-primary text-primary-foreground font-medium"
                                : "bg-card hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            All
                          </button>
                          {field.options?.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() =>
                                updateQueryParams({ [field.id]: opt.value })
                              }
                              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                currentValue === opt.value
                                ? "bg-primary text-primary-foreground font-medium"
                                : "bg-card hover:bg-muted text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-muted-foreground"
                  >
                    Reset all filters
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setDrawerOpen(false)}
                    className="text-xs"
                  >
                    Done
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>

        {/* Right Tools: Sort & Group */}
        <div className="flex items-center gap-1.5">
          {sortOptions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-normal"
                  />
                }
              >
                <ArrowDownUp className="size-3 text-muted-foreground" />
                <span>Sort:</span>
                <span className="font-medium truncate max-w-[90px]">
                  {activeSort?.label || "Default"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateQueryParams({ sort: null })}
                  className="flex items-center justify-between"
                >
                  <span>Default</span>
                  {!currentSort ? <Check className="size-3" /> : null}
                </DropdownMenuItem>
                {sortOptions.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => updateQueryParams({ sort: s.value })}
                    className="flex items-center justify-between"
                  >
                    <span>{s.label}</span>
                    {currentSort === s.value ? (
                      <Check className="size-3" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {groupOptions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs font-normal"
                  />
                }
              >
                <Layers className="size-3 text-muted-foreground" />
                <span>Group:</span>
                <span className="font-medium truncate max-w-[80px]">
                  {activeGroup?.label || "None"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuLabel>Group by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateQueryParams({ group: null })}
                  className="flex items-center justify-between"
                >
                  <span>None</span>
                  {!currentGroup ? <Check className="size-3" /> : null}
                </DropdownMenuItem>
                {groupOptions.map((g) => (
                  <DropdownMenuItem
                    key={g.value}
                    onClick={() => updateQueryParams({ group: g.value })}
                    className="flex items-center justify-between"
                  >
                    <span>{g.label}</span>
                    {currentGroup === g.value ? (
                      <Check className="size-3" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* Smart Presets & Active Filter Chips Bar */}
      {(presets.length > 0 || activeFilters.length > 0 || searchTerm) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          {/* Smart Presets */}
          {presets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[0.6875rem] font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3" /> Views:
              </span>
              {presets.map((p) => {
                const isActive = Object.entries(p.filters).every(
                  ([k, v]) => searchParams.get(k) === v
                )

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isActive) {
                        // toggle off
                        const clearObj: Record<string, string | null> = {}
                        Object.keys(p.filters).forEach((k) => (clearObj[k] = null))
                        updateQueryParams(clearObj)
                      } else {
                        updateQueryParams(p.filters)
                      }
                    }}
                    className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] transition-colors border ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium border-primary"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          ) : <div />}

          {/* Active Chips & Clear All */}
          {(activeFilters.length > 0 || searchTerm || dateLabel) ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {dateLabel ? (
                <Badge
                  variant="secondary"
                  className="gap-1 text-[0.625rem] font-normal pl-2 pr-1"
                >
                  <CalendarIcon className="size-2.5 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium capitalize">
                    {activeDateField || "Date"}:
                  </span>
                  <span className="font-semibold">{dateLabel}</span>
                  <button
                    onClick={() =>
                      updateQueryParams({
                        datePreset: null,
                        dateFrom: null,
                        dateTo: null,
                        dateMonth: null,
                      })
                    }
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ) : null}

              {searchTerm ? (
                <Badge
                  variant="secondary"
                  className="gap-1 text-[0.625rem] font-normal pl-2 pr-1"
                >
                  <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      updateQueryParams({ q: null })
                    }}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ) : null}

              {activeFilters.map((af) => (
                <Badge
                  key={af.key}
                  variant="secondary"
                  className="gap-1 text-[0.625rem] font-normal pl-2 pr-1"
                >
                  <span className="text-muted-foreground">{af.label}:</span>
                  <span className="font-medium">{af.valueLabel}</span>
                  <button
                    onClick={() => updateQueryParams({ [af.key]: null })}
                    className="rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}

              <button
                onClick={handleClearAll}
                className="text-[0.6875rem] text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
