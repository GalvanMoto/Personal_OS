"use client"

import { useState, type FormEvent } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3 } from "lucide-react"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  QuestionnaireChoice,
  QuestionnaireChoices,
} from "@/components/ui/questionnaire"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Block =
  | { kind: "md"; text: string }
  | { kind: "metrics"; json: string }
  | { kind: "chart"; json: string }
  | { kind: "info"; json: string }
  | { kind: "questionnaire"; json: string }

const SPECIAL = new Set(["metrics", "chart", "info", "questionnaire"])

function parseBlocks(content?: string): Block[] {
  if (!content || typeof content !== "string") return []
  const blocks: Block[] = []
  
  // Handles:
  // 1. Standard / flexible code fences: ```(metrics|chart|info|questionnaire|json|\w*)\n?([\s\S]*?)```
  // 2. Un-fenced raw prefixes: (metrics|chart|info|questionnaire)\s*([\[{][\s\S]*?[\]}])
  // 3. Raw standalone JSON chart objects: {"type":"bar"|"line"|"area"|"pie", ...}
  const re = /(?:```(?:json:)?(metrics|chart|info|questionnaire|\w*)\s*([\s\S]*?)(?:```|$))|(?:(?:^|\n)(metrics|chart|info|questionnaire)\s*(\[\s*\{[\s\S]*?\}\s*\]|\{\s*[\s\S]*?\})(?=\n\n|\n[A-Z*#-]|\s*$))|(?:(?:^|\n)\s*(\{\s*"type"\s*:\s*"(?:bar|line|area|pie)"[\s\S]*?\}\s*)(?=\n\n|\n[A-Z*#-]|\s*$))/gi
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      const preceding = (content.slice(last, match.index) || "").trim()
      if (preceding) {
        blocks.push({ kind: "md", text: preceding })
      }
    }

    if (match[1] !== undefined) {
      // Fenced block
      const lang = (match[1] || "").toLowerCase()
      const body = (match[2] || "").trim()
      if (SPECIAL.has(lang)) {
        blocks.push({
          kind: lang as Exclude<Block["kind"], "md">,
          json: body,
        })
      } else {
        const parsed = safeParse<any>(body)
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed) && parsed.length > 0 && "label" in parsed[0] && "value" in parsed[0]) {
            blocks.push({ kind: "metrics", json: body })
          } else if ("type" in parsed && ["bar", "line", "area", "pie"].includes(parsed.type)) {
            blocks.push({ kind: "chart", json: body })
          } else {
            blocks.push({ kind: "md", text: match[0] || "" })
          }
        } else {
          blocks.push({ kind: "md", text: match[0] || "" })
        }
      }
    } else if (match[3]) {
      // Un-fenced keyword block
      const lang = (match[3] || "").toLowerCase()
      const body = (match[4] || "").trim()
      if (SPECIAL.has(lang)) {
        blocks.push({
          kind: lang as Exclude<Block["kind"], "md">,
          json: body,
        })
      } else {
        blocks.push({ kind: "md", text: match[0] || "" })
      }
    } else if (match[5]) {
      // Raw standalone JSON chart object
      const body = (match[5] || "").trim()
      blocks.push({
        kind: "chart",
        json: body,
      })
    }

    last = re.lastIndex
  }

  if (last < content.length) {
    const trailing = (content.slice(last) || "").trim()
    if (trailing) {
      blocks.push({ kind: "md", text: trailing })
    }
  }

  return blocks.length > 0 ? blocks : [{ kind: "md", text: content }]
}

function safeParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    try {
      const clean = json.replace(/,\s*([\]}])/g, "$1").trim()
      return JSON.parse(clean) as T
    } catch {
      return null
    }
  }
}

function InteractiveCheckbox({ checked }: { checked?: boolean }) {
  const [on, setOn] = useState(Boolean(checked))
  return (
    <Checkbox
      checked={on}
      onCheckedChange={(next) => setOn(next === true)}
      className="mt-0.5 size-3.5 shrink-0"
    />
  )
}

const markdownComponents = {
  h1: ({ node, ...p }: any) => (
    <h1 className="mb-1.5 mt-2 text-xs font-semibold tracking-tight text-foreground border-b pb-0.5" {...p} />
  ),
  h2: ({ node, ...p }: any) => (
    <h2 className="mb-1 mt-1.5 text-xs font-semibold tracking-tight text-foreground" {...p} />
  ),
  h3: ({ node, ...p }: any) => (
    <h3 className="mb-0.5 mt-1 text-xs font-semibold text-foreground/90" {...p} />
  ),
  p: ({ node, ...p }: any) => (
    <p className="my-0.5 leading-relaxed text-xs text-foreground/90" {...p} />
  ),
  blockquote: ({ node, ...p }: any) => (
    <blockquote className="my-1 border-l-2 border-primary/60 bg-primary/5 pl-2 py-0.5 text-xs italic text-muted-foreground rounded-r" {...p} />
  ),
  ul: ({ node, ...p }: any) => {
    const isTaskList = String(p.className || "").includes("contains-task-list")
    return (
      <ul
        className={cn(
          "my-1 text-xs",
          isTaskList ? "list-none pl-0 space-y-1" : "list-disc pl-3.5 space-y-0.5"
        )}
        {...p}
      />
    )
  },
  ol: ({ node, ...p }: any) => (
    <ol className="my-1 list-decimal pl-3.5 space-y-0.5 text-xs" {...p} />
  ),
  li: ({ node, ...p }: any) => {
    const isTask = String(p.className || "").includes("task-list-item")
    return (
      <li
        className={cn(
          "leading-relaxed text-xs",
          isTask ? "list-none flex items-start gap-2 my-1" : "my-0.5"
        )}
        {...p}
      />
    )
  },
  a: ({ node, ...p }: any) => {
    const href: string | undefined = p.href
    const safe =
      !href ||
      href.startsWith("/") ||
      href.startsWith("#") ||
      /^https?:\/\//i.test(href)
        ? href
        : undefined
    if (!safe) return <span className="text-muted-foreground" {...p} />
    return (
      <a
        className="text-primary underline font-medium underline-offset-2 hover:opacity-80"
        target="_blank"
        rel="noopener noreferrer"
        {...p}
        href={safe}
      />
    )
  },
  pre: ({ node, ...p }: any) => <>{p.children}</>,
  code: ({ node, ...p }: any) => {
    const isBlock = String(p.className || "").includes("language-")
    if (isBlock) {
      return (
        <code
          className="my-1.5 block overflow-x-auto rounded-md bg-muted/60 p-2 font-mono text-[0.6875rem] border"
          {...p}
        />
      )
    }
    return (
      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[0.6875rem] border" {...p} />
    )
  },
  table: ({ node, ...p }: any) => (
    <div className="my-1.5 overflow-x-auto rounded-md border bg-card shadow-xs">
      <Table className="text-[0.6875rem]" {...p} />
    </div>
  ),
  thead: ({ node, ...p }: any) => <TableHeader {...p} />,
  tbody: ({ node, ...p }: any) => <TableBody {...p} />,
  tr: ({ node, ...p }: any) => <TableRow {...p} />,
  th: ({ node, ...p }: any) => (
    <TableHead
      className="h-7 text-[0.5625rem] font-semibold tracking-wider uppercase"
      {...p}
    />
  ),
  td: ({ node, ...p }: any) => (
    <TableCell className="py-1 align-top text-[0.6875rem]" {...p} />
  ),
  input: ({ node, ...p }: any) => {
    if (p.type === "checkbox") {
      return <InteractiveCheckbox checked={p.checked} />
    }
    return <input {...p} />
  },
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="text-xs text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  )
}

type Metric = { label: string; value: string; delta?: string }

function MetricsBlock({ json }: { json: string }) {
  const data = safeParse<Metric[]>(json)
  if (!data || !Array.isArray(data)) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }
  return (
    <ItemGroup className="my-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
      {data.map((metric, index) => (
        <Item key={index} variant="outline" size="sm" className="flex-col items-start gap-0.5">
          <ItemDescription className="text-[0.5625rem] font-semibold tracking-wider uppercase">
            {metric.label}
          </ItemDescription>
          <ItemTitle className="text-sm font-semibold tabular-nums">
            {metric.value}
          </ItemTitle>
          {metric.delta ? (
            <ItemDescription className="text-[0.5625rem] font-medium text-primary">
              {metric.delta}
            </ItemDescription>
          ) : null}
        </Item>
      ))}
    </ItemGroup>
  )
}

type ChartSpec = {
  type?: "bar" | "line" | "area" | "pie"
  xKey?: string
  series?: { key: string; label: string; color?: string }[]
  data?: Record<string, string | number>[]
}

const PALETTE = ["#10b981", "#6366f1", "#f59e0b", "#06b6d4", "#ef4444", "#a855f7"]

function ChartBlock({ json }: { json: string }) {
  const spec = safeParse<ChartSpec>(json)
  if (!spec) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }

  if (!Array.isArray(spec.data) || spec.data.length === 0) {
    return (
      <Empty className="my-1.5 border border-dashed p-4">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3 />
          </EmptyMedia>
          <EmptyTitle className="text-[0.6875rem]">
            Nothing recorded for this yet
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  // 1. Determine xKey automatically
  const firstRow = spec.data[0]
  const xKey =
    spec.xKey ||
    Object.keys(firstRow).find(
      (k) =>
        typeof firstRow[k] === "string" ||
        ["category", "name", "label", "month", "day", "week", "service"].includes(k.toLowerCase())
    ) ||
    Object.keys(firstRow)[0] ||
    "name"

  // 2. Normalize numbers in data (clean formatted strings like "₹1,675.00" -> 1675)
  const normalizedData = spec.data.map((row) => {
    const clean: Record<string, any> = { ...row }
    for (const [k, v] of Object.entries(row)) {
      if (k !== xKey) {
        if (typeof v === "number") {
          clean[k] = v
        } else if (typeof v === "string") {
          const parsed = parseFloat(v.replace(/[^0-9.-]/g, ""))
          clean[k] = isNaN(parsed) ? 0 : parsed
        }
      }
    }
    return clean
  })

  // 3. Determine series automatically if missing
  let series = spec.series && spec.series.length > 0 ? spec.series : []
  if (series.length === 0) {
    const valueKeys = Object.keys(normalizedData[0]).filter((k) => k !== xKey)
    series = valueKeys.map((k) => ({
      key: k,
      label: k.charAt(0).toUpperCase() + k.slice(1),
    }))
  }

  const type = spec.type ?? "bar"

  // shadcn's ChartContainer owns the responsive wrapper, the theme-aware
  // colours and the tooltip, so the four near-identical inline tooltip styles
  // this used to carry are gone — and the palette now follows the workspace
  // theme in both light and dark instead of six hardcoded hex values.
  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((entry, index) => [
      entry.key,
      {
        label: entry.label,
        color: entry.color ?? `var(--chart-${(index % 5) + 1})`,
      },
    ])
  )

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey={xKey}
        tickLine={false}
        axisLine={false}
        tickMargin={6}
        tick={{ fontSize: 9 }}
      />
      <YAxis tickLine={false} axisLine={false} width={34} tick={{ fontSize: 9 }} />
      <ChartTooltip content={<ChartTooltipContent />} />
    </>
  )

  return (
    <ChartContainer
      config={chartConfig}
      className="my-1.5 aspect-auto h-36 w-full rounded-lg border bg-card/80 p-2 shadow-xs"
    >
      {type === "pie" ? (
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey={xKey} />} />
          <Pie
            data={normalizedData}
            dataKey={series[0]?.key ?? "amount"}
            nameKey={xKey}
            outerRadius="75%"
          >
            {normalizedData.map((_, index) => (
              <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey={xKey} />} />
        </PieChart>
      ) : type === "line" ? (
        <LineChart data={normalizedData} margin={{ top: 5, right: 5, left: -12 }}>
          {axes}
          {series.map((entry) => (
            <Line
              key={entry.key}
              type="monotone"
              dataKey={entry.key}
              name={entry.label}
              stroke={`var(--color-${entry.key})`}
              strokeWidth={1.75}
              dot={false}
            />
          ))}
        </LineChart>
      ) : type === "area" ? (
        <AreaChart data={normalizedData} margin={{ top: 5, right: 5, left: -12 }}>
          {axes}
          {series.map((entry) => (
            <Area
              key={entry.key}
              type="monotone"
              dataKey={entry.key}
              name={entry.label}
              stroke={`var(--color-${entry.key})`}
              fill={`var(--color-${entry.key})`}
              fillOpacity={0.2}
              strokeWidth={1.75}
            />
          ))}
        </AreaChart>
      ) : (
        <BarChart data={normalizedData} margin={{ top: 5, right: 5, left: -12 }}>
          {axes}
          {series.map((entry) => (
            <Bar
              key={entry.key}
              dataKey={entry.key}
              name={entry.label}
              fill={`var(--color-${entry.key})`}
              radius={3}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  )
}

type InfoSpec = { title?: string; subtitle?: string; fields?: [string, string][] }

function InfoCard({ json }: { json: string }) {
  const spec = safeParse<InfoSpec>(json)
  if (!spec) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }
  return (
    <Item variant="outline" size="sm" className="my-1.5 flex-col items-stretch gap-1.5">
      <ItemContent className="gap-0">
        {spec.title ? <ItemTitle>{spec.title}</ItemTitle> : null}
        {spec.subtitle ? (
          <ItemDescription className="font-mono">{spec.subtitle}</ItemDescription>
        ) : null}
      </ItemContent>
      {spec.fields?.length ? (
        <Table className="text-[0.625rem]">
          <TableBody>
            {spec.fields.map(([key, value], index) => (
              <TableRow key={index} className="border-none hover:bg-transparent">
                <TableCell className="w-[40%] py-1 font-medium text-muted-foreground">
                  {key}
                </TableCell>
                <TableCell className="py-1 font-semibold text-foreground">
                  {value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </Item>
  )
}

type Question = {
  id: string
  label: string
  type?: "text" | "date" | "number" | "select"
  options?: string[]
}

type QuestionnaireSpec = {
  prompt?: string
  questions: Question[]
}

function QuestionnaireBlock({
  json,
  onSubmit,
}: {
  json: string
  onSubmit?: (summary: string) => void
}) {
  const spec = safeParse<QuestionnaireSpec>(json)
  const [submitted, setSubmitted] = useState(false)

  if (!spec || !Array.isArray(spec.questions) || spec.questions.length === 0) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }

  const questions = spec.questions

  // One question on screen at a time, with progress and back/next, rather than
  // a wall of inputs. The answers come out of the form itself on submit, so
  // there is no parallel answer state to keep in step with the DOM.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const lines = questions.map((question) => {
      const value = data.get(question.id)
      return `${question.label}: ${value ? String(value) : "—"}`
    })
    setSubmitted(true)
    onSubmit?.(lines.join("\n"))
  }

  if (submitted) {
    return (
      <Item variant="muted" size="sm" className="my-1.5">
        <ItemContent>
          <ItemDescription>Answers sent.</ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  return (
    <Questionnaire
      onSubmit={handleSubmit}
      items={questions.map((question) => ({
        name: question.id,
        choices: question.options?.map((option) => ({ value: option })),
      }))}
      className="my-1.5 rounded-lg border border-primary/30 bg-card/80 p-3"
    >
      <QuestionnaireProgress />

      {questions.map((question) => (
        <QuestionnaireItem key={question.id} name={question.id}>
          <QuestionnaireTitle className="text-xs">
            {question.label}
          </QuestionnaireTitle>

          {question.type === "select" && question.options?.length ? (
            <QuestionnaireChoices>
              {question.options.map((option) => (
                <QuestionnaireChoice key={option} value={option}>
                  {option}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
          ) : (
            <QuestionnaireInput
              type={question.type === "number" ? "number" : question.type === "date" ? "date" : "text"}
              placeholder="Your answer"
            />
          )}

          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </QuestionnaireItem>
      ))}
    </Questionnaire>
  )
}

function RenderBlock({
  block,
  onQuestionnaireSubmit,
}: {
  block: Block
  onQuestionnaireSubmit?: (summary: string) => void
}) {
  switch (block.kind) {
    case "md":
      return <Markdown text={block.text} />
    case "metrics":
      return <MetricsBlock json={block.json} />
    case "chart":
      return <ChartBlock json={block.json} />
    case "info":
      return <InfoCard json={block.json} />
    case "questionnaire":
      return (
        <QuestionnaireBlock
          json={block.json}
          onSubmit={onQuestionnaireSubmit}
        />
      )
  }
}

export function RichContent({
  content,
  onQuestionnaireSubmit,
}: {
  content: string
  onQuestionnaireSubmit?: (summary: string) => void
}) {
  const blocks = parseBlocks(content)
  return (
    <div className="space-y-0.5">
      {blocks.map((b, i) => (
        <RenderBlock
          key={i}
          block={b}
          onQuestionnaireSubmit={onQuestionnaireSubmit}
        />
      ))}
    </div>
  )
}
