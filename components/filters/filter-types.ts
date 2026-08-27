export type FilterOption = {
  label: string
  value: string
  count?: number
}

export type FilterField = {
  id: string
  label: string
  type: "select" | "multi-select" | "date-preset" | "boolean"
  options?: FilterOption[]
}

export type SmartPreset = {
  id: string
  label: string
  icon?: string
  filters: Record<string, string>
}

export type SortOption = {
  label: string
  value: string
  direction: "asc" | "desc"
}

export type GroupOption = {
  label: string
  value: string
}
