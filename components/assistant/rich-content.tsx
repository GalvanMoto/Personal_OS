"use client"

import { useState, type ReactNode } from "react"
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "@/lib/utils"

type Block =
  | { kind: "md"; text: string }
  | { kind: "metrics"; json: string }
  | { kind: "chart"; json: string }
  | { kind: "info"; json: string }
  | { kind: "questionnaire"; json: string }

const SPECIAL = new Set(["metrics", "chart", "info", "questionnaire"])

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  
  // Handles:
  // 1. Standard / flexible code fences: ```(metrics|chart|info|questionnaire)\n?([\s\S]*?)```
  // 2. Un-fenced raw prefixes: metrics [ { ... } ] or chart { ... }
  const re = /(?:```(?:json:)?(metrics|chart|info|questionnaire|\w+)\s*([\s\S]*?)(?:```|$))|(?:(?:^|\n)(metrics|chart|info|questionnaire)\s*(\[\s*\{[\s\S]*?\}\s*\]|\{\s*[\s\S]*?\})(?=\n\n|\n[A-Z*#-]|\s*$))/gi
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      const preceding = content.slice(last, match.index).trim()
      if (preceding) {
        blocks.push({ kind: "md", text: preceding })
      }
    }

    if (match[1]) {
      // Fenced block
      const lang = match[1].toLowerCase()
      const body = (match[2] || "").trim()
      if (SPECIAL.has(lang)) {
        blocks.push({
          kind: lang as Exclude<Block["kind"], "md">,
          json: body,
        })
      } else {
        blocks.push({ kind: "md", text: match[0] })
      }
    } else if (match[3]) {
      // Un-fenced keyword block
      const lang = match[3].toLowerCase()
      const body = (match[4] || "").trim()
      if (SPECIAL.has(lang)) {
        blocks.push({
          kind: lang as Exclude<Block["kind"], "md">,
          json: body,
        })
      } else {
        blocks.push({ kind: "md", text: match[0] })
      }
    }

    last = re.lastIndex
  }

  if (last < content.length) {
    const trailing = content.slice(last).trim()
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
    <input
      type="checkbox"
      checked={on}
      onChange={() => setOn((v) => !v)}
      className="mt-0.5 size-3.5 rounded border border-input accent-primary text-primary focus:ring-primary cursor-pointer shrink-0 align-middle inline-block"
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
      <table className="w-full border-collapse text-[0.6875rem]" {...p} />
    </div>
  ),
  thead: ({ node, ...p }: any) => (
    <thead className="bg-muted/60 border-b" {...p} />
  ),
  th: ({ node, ...p }: any) => (
    <th
      className="px-2.5 py-1 text-left font-semibold text-foreground tracking-wider uppercase text-[0.5625rem]"
      {...p}
    />
  ),
  td: ({ node, ...p }: any) => (
    <td className="border-b border-border/30 px-2.5 py-1 align-top text-foreground/90 text-[0.6875rem]" {...p} />
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
    <div className="my-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
      {data.map((m, i) => (
        <div key={i} className="rounded-lg border border-border/60 bg-card/80 p-2 shadow-xs hover:border-primary/40 transition-all">
          <p className="text-[0.5625rem] uppercase tracking-wider font-semibold text-muted-foreground truncate">
            {m.label}
          </p>
          <p className="text-sm font-semibold tabular-nums mt-0.5 text-foreground leading-none">{m.value}</p>
          {m.delta ? (
            <p className="text-[0.5625rem] text-primary font-medium mt-1 truncate leading-none">{m.delta}</p>
          ) : null}
        </div>
      ))}
    </div>
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
  if (!spec || !Array.isArray(spec.data) || spec.data.length === 0) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
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
  const height = 135

  return (
    <div className="my-1.5 rounded-lg border border-border/60 bg-card/80 p-2 shadow-xs">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie
                data={normalizedData}
                dataKey={series[0]?.key ?? "amount"}
                nameKey={xKey}
                outerRadius="75%"
              >
                {normalizedData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px",
                }}
              />
            </PieChart>
          ) : type === "line" ? (
            <LineChart data={normalizedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.25} />
              <XAxis dataKey={xKey} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={32} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px",
                }}
              />
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color ?? PALETTE[i % PALETTE.length]}
                  strokeWidth={1.75}
                />
              ))}
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={normalizedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.25} />
              <XAxis dataKey={xKey} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={32} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px",
                }}
              />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color ?? PALETTE[i % PALETTE.length]}
                  fill={s.color ?? PALETTE[i % PALETTE.length]}
                  fillOpacity={0.2}
                  strokeWidth={1.75}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={normalizedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.25} />
              <XAxis dataKey={xKey} tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={32} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  borderColor: "var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px",
                }}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color ?? PALETTE[i % PALETTE.length]}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

type InfoSpec = { title?: string; subtitle?: string; fields?: [string, string][] }

function InfoCard({ json }: { json: string }) {
  const spec = safeParse<InfoSpec>(json)
  if (!spec) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }
  return (
    <div className="my-1.5 rounded-lg border border-border/60 bg-card/80 p-2.5 shadow-xs">
      {spec.title ? (
        <p className="mb-0.5 text-xs font-semibold text-foreground">{spec.title}</p>
      ) : null}
      {spec.subtitle ? (
        <p className="mb-1.5 text-[0.625rem] text-muted-foreground font-mono">{spec.subtitle}</p>
      ) : null}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        {spec.fields?.map(([k, v], i) => (
          <div key={i} className="contents">
            <dt className="text-muted-foreground font-medium text-[0.625rem]">{k}</dt>
            <dd className="font-semibold text-foreground text-[0.625rem]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
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
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!spec || !Array.isArray(spec.questions)) {
    return <pre className="my-1.5 rounded bg-muted/60 p-1.5 text-[0.65rem]">{json}</pre>
  }

  function handleSend() {
    setSubmitted(true)
    const lines = spec!.questions.map((q) => {
      const ans = answers[q.id] || "—"
      return `${q.label}: ${ans}`
    })
    onSubmit?.(lines.join("\n"))
  }

  return (
    <div className="my-1.5 rounded-lg border border-primary/30 bg-card/80 p-2.5 shadow-xs">
      {spec.prompt ? (
        <p className="mb-2 text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span>{spec.prompt}</span>
        </p>
      ) : null}
      <div className="space-y-1.5">
        {spec.questions.map((q) => (
          <div key={q.id} className="space-y-0.5">
            <label className="text-[0.625rem] font-medium text-muted-foreground">
              {q.label}
            </label>
            {q.type === "select" && q.options ? (
              <select
                disabled={submitted}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-7"
              >
                <option value="">Choose…</option>
                {q.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled={submitted}
                type={q.type ?? "text"}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-7"
              />
            )}
          </div>
        ))}
      </div>
      {!submitted && onSubmit ? (
        <div className="mt-2.5 flex justify-end">
          <button
            onClick={handleSend}
            className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-all h-7"
          >
            Submit
          </button>
        </div>
      ) : null}
    </div>
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
