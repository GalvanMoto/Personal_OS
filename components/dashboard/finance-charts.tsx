"use client"

import { useId } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  CATEGORICAL,
  MAX_CATEGORIES,
  OTHER,
  SERIES,
  rankSlot,
  chartTheme,
  type Slot,
} from "@/components/dashboard/viz-palette"
import { formatMoney, money } from "@/lib/domain/money"
import { cn } from "@/lib/utils"

/**
 * Finance charts.
 *
 * Forms chosen by the job the data does: a trend gets bars over time, a
 * part-to-whole gets one segmented bar with a ranked legend, and a ranking gets
 * one hue rather than a value ramp (bar length already encodes magnitude —
 * shading it too would burn the only free channel on information already shown).
 */

const shortMoney = (minor: number, currency = "INR") => {
  const major = Math.round(minor / 100)
  const symbol = currency === "INR" ? "₹" : ""

  if (major >= 10_000_000) return `${symbol}${(major / 10_000_000).toFixed(1)}Cr`
  if (major >= 100_000) return `${symbol}${(major / 100_000).toFixed(1)}L`
  if (major >= 1_000) return `${symbol}${(major / 1_000).toFixed(1)}k`
  return `${symbol}${major}`
}

// ---------------------------------------------------------------------------
// Sparkline — the trend behind a stat tile
// ---------------------------------------------------------------------------

/**
 * A bare trend for a headline number.
 *
 * No axes, legend or tooltip: it is context for the number beside it, not a
 * chart to be read precisely. Bars sit on a shared baseline with a 2px gap so
 * individual days stay countable.
 */
export function Sparkline({
  points,
  slot = CATEGORICAL[0],
  className,
}: {
  points: number[]
  slot?: Slot
  className?: string
}) {
  const id = useId().replace(/:/g, "")
  const max = Math.max(...points, 1)

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `[data-spark="${id}"]{--spark:${slot.light}}.dark [data-spark="${id}"]{--spark:${slot.dark}}`,
        }}
      />
      <div
        data-spark={id}
        aria-hidden
        className={cn("flex h-8 items-end gap-[2px]", className)}
      >
        {points.map((value, index) => (
          <span
            key={index}
            className="min-h-[2px] flex-1 rounded-t-[2px] bg-(--spark)"
            style={{ height: `${Math.max(4, (value / max) * 100)}%`, opacity: value === 0 ? 0.25 : 1 }}
          />
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Spend vs received over time
// ---------------------------------------------------------------------------

export type SpendPointView = {
  label: string
  spentMinor: number
  earnedMinor: number
}

/**
 * Two money series over months.
 *
 * Both are rupees, so they share one axis — a second y-scale would let the
 * chart imply a relationship the numbers do not contain.
 */
export function SpendVsIncomeChart({
  data,
  currency = "INR",
}: {
  data: SpendPointView[]
  currency?: string
}) {
  const config = {
    spentMinor: { label: "Spent", theme: chartTheme(SERIES.spent) },
    earnedMinor: { label: "Received", theme: chartTheme(SERIES.earned) },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} barGap={2} margin={{ left: 4, right: 4, top: 8 }}>
        {/* Horizontal hairlines only — vertical rules add noise on a categorical axis. */}
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-[0.625rem]"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) => shortMoney(value, currency)}
          className="text-[0.625rem]"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => shortMoney(Number(value), currency)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="spentMinor" fill="var(--color-spentMinor)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        <Bar dataKey="earnedMinor" fill="var(--color-earnedMinor)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

// ---------------------------------------------------------------------------
// Category breakdown — one segmented bar plus a ranked, directly-labelled legend
// ---------------------------------------------------------------------------

export type CategoryRow = {
  category: string
  minor: number
  share: number
}

/**
 * Where the money went.
 *
 * Part-to-whole at a glance, so a single segmented bar rather than a pie: close
 * values stay comparable because every row is also labelled with its amount and
 * share. Only three hues are drawn — a size-ordered stack can put any two
 * categories next to each other, so the all-pairs gate applies and only three
 * slots clear it. The remainder folds into a neutral "Other"; the exact figures
 * for every category live in the table below.
 */
export function CategoryBreakdown({
  rows,
  currency = "INR",
}: {
  rows: CategoryRow[]
  currency?: string
}) {
  // Formatted here rather than via a prop: a Server Component cannot hand a
  // function to a Client one, and `money.ts` is pure so both sides agree.
  const formatAmount = (minor: number) => formatMoney(money(minor, currency))

  const id = useId().replace(/:/g, "")

  const head = rows.slice(0, MAX_CATEGORIES)
  const tail = rows.slice(MAX_CATEGORIES)

  const segments = [
    ...head.map((row, index) => ({
      key: row.category,
      label: row.category.toLowerCase(),
      minor: row.minor,
      share: row.share,
      slot: rankSlot(index),
    })),
    ...(tail.length > 0
      ? [
          {
            key: "__other",
            label: `other (${tail.length})`,
            minor: tail.reduce((sum, row) => sum + row.minor, 0),
            share: Math.round(tail.reduce((sum, row) => sum + row.share, 0) * 10) / 10,
            slot: OTHER,
          },
        ]
      : []),
  ]

  const css = segments
    .map(
      (segment, index) =>
        `[data-viz="${id}"]{--seg-${index}:${segment.slot.light}}.dark [data-viz="${id}"]{--seg-${index}:${segment.slot.dark}}`
    )
    .join("")

  if (segments.length === 0) {
    return <p className="text-xs text-muted-foreground">Nothing spent in this period.</p>
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div data-viz={id} className="flex flex-col gap-3">
        {/* 2px surface gaps keep adjacent segments legible without outlines. */}
        <div className="flex h-2 w-full gap-[2px] overflow-hidden">
          {segments.map((segment, index) => (
            <span
              key={segment.key}
              className="rounded-[2px]"
              style={{
                width: `${Math.max(segment.share, 1)}%`,
                backgroundColor: `var(--seg-${index})`,
              }}
            />
          ))}
        </div>

        <dl className="flex flex-col gap-1.5 text-xs">
          {segments.map((segment, index) => (
            <div key={segment.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: `var(--seg-${index})` }}
              />
              {/* Direct labels, not colour alone — identity never depends on hue. */}
              <dt className="truncate">{segment.label}</dt>
              <dd className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                {formatAmount(segment.minor)}
              </dd>
              <dd className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                {segment.share}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Top merchants — a ranking, so one hue
// ---------------------------------------------------------------------------

export type MerchantRow = {
  merchant: string
  minor: number
  count: number
}

export function TopMerchants({
  rows,
  currency = "INR",
}: {
  rows: MerchantRow[]
  currency?: string
}) {
  const config = {
    minor: { label: "Spent", theme: chartTheme(CATEGORICAL[0]) },
  } satisfies ChartConfig

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">No spending recorded yet.</p>
  }

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 4, right: 12 }}
        barCategoryGap={6}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => shortMoney(value, currency)}
          className="text-[0.625rem]"
        />
        <YAxis
          type="category"
          dataKey="merchant"
          tickLine={false}
          axisLine={false}
          width={96}
          className="text-[0.625rem]"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => shortMoney(Number(value), currency)}
            />
          }
        />
        {/* One series, one colour: bar length already carries magnitude. */}
        <Bar dataKey="minor" fill="var(--color-minor)" radius={[0, 4, 4, 0]} maxBarSize={14} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}
