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
import { OTHER, SERIES, chartTheme, rankSlot } from "@/components/dashboard/viz-palette"
import { cn } from "@/lib/utils"

/**
 * Overview charts.
 *
 * Three series of the same unit (tasks) share one axis; the breakdown is one
 * segmented bar with a ranked, directly-labelled legend. Both are drawn from
 * the three all-pairs-validated hues.
 */

export type ThroughputPointView = {
  label: string
  captured: number
  completed: number
  blocked: number
}

export function ThroughputChart({ data }: { data: ThroughputPointView[] }) {
  const config = {
    captured: { label: "Captured", theme: chartTheme(SERIES.captured) },
    completed: { label: "Completed", theme: chartTheme(SERIES.completed) },
    blocked: { label: "Waiting", theme: chartTheme(SERIES.blocked) },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-52 w-full">
      <BarChart data={data} barGap={2} margin={{ left: 0, right: 4, top: 4 }}>
        {/* Hairline horizontals only; vertical rules add noise on a band axis. */}
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
          width={28}
          allowDecimals={false}
          className="text-[0.625rem]"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="captured" fill="var(--color-captured)" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        <Bar dataKey="blocked" fill="var(--color-blocked)" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

export type WorkloadRowView = {
  name: string
  count: number
  share: number
}

/**
 * Open work per client.
 *
 * Three hues plus a neutral tail, because a size-ordered stack can place any
 * two clients side by side — see the note in `viz-palette.ts`. Every row is
 * named and numbered, so the colour is a locator, never the identity.
 */
export function WorkloadBreakdown({
  total,
  rows,
  emptyLabel = "No open work",
}: {
  total: number
  rows: WorkloadRowView[]
  emptyLabel?: string
}) {
  const id = useId().replace(/:/g, "")

  if (rows.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
  }

  const head = rows.slice(0, 3)
  const tail = rows.slice(3)

  const segments = [
    ...head.map((row, index) => ({ ...row, slot: rankSlot(index) })),
    ...(tail.length > 0
      ? [
          {
            name: `Other (${tail.length})`,
            count: tail.reduce((sum, row) => sum + row.count, 0),
            share:
              Math.round(tail.reduce((sum, row) => sum + row.share, 0) * 10) / 10,
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div data-viz={id} className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-muted-foreground">Open deliverables</span>
          <span className="text-sm font-medium tabular-nums">{total}</span>
        </div>

        {/* 2px surface gaps keep neighbouring segments countable without borders. */}
        <div className="flex h-2.5 w-full gap-[2px]">
          {segments.map((segment, index) => (
            <span
              key={segment.name}
              className="rounded-[3px]"
              style={{
                width: `${Math.max(segment.share, 2)}%`,
                backgroundColor: `var(--seg-${index})`,
              }}
            />
          ))}
        </div>

        <dl className="flex flex-col gap-2 text-xs">
          {segments.map((segment, index) => (
            <div key={segment.name} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: `var(--seg-${index})` }}
              />
              <dt className="truncate">{segment.name}</dt>
              {/* Leader dots tie a long name to its figures across the gap. */}
              <span
                aria-hidden
                className="mx-1 min-w-4 flex-1 border-b border-dotted border-border/60"
              />
              <dd className="shrink-0 tabular-nums">{segment.count}</dd>
              <dd className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                {segment.share}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

/**
 * Trend behind a headline number.
 *
 * No axes or tooltip: it is context for the figure beside it, not a chart to be
 * read precisely.
 */
export function StatSparkline({
  points,
  tone = "captured",
  className,
}: {
  points: number[]
  tone?: keyof typeof SERIES
  className?: string
}) {
  const id = useId().replace(/:/g, "")
  const slot = SERIES[tone]
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
        className={cn("flex h-9 items-end gap-[2px]", className)}
      >
        {points.map((value, index) => (
          <span
            key={index}
            className="min-h-[3px] flex-1 rounded-t-[2px] bg-(--spark)"
            style={{
              height: `${Math.max(6, (value / max) * 100)}%`,
              opacity: value === 0 ? 0.22 : 1,
            }}
          />
        ))}
      </div>
    </>
  )
}
