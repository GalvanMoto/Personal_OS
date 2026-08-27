"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { clientTools, type UIMessage } from "@tanstack/ai-client"
import {
  createChatClientOptions,
  fetchServerSentEvents,
  useChat,
} from "@tanstack/ai-react"
import {
  BarChart3,
  CreditCard,
  FileText,
  HelpCircle,
  ListTodo,
  Plus,
  SendIcon,
  ShieldAlert,
  Sparkles,
  SquareIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  confirmWithUserDef,
  focusTaskDef,
  sendEmailDef,
} from "@/lib/ai/agent/definitions"
import { RichContent } from "@/components/assistant/rich-content"
import { ToolExecutionPill } from "./tool-execution-pill"
import { cn } from "@/lib/utils"

type ConfirmAnswer = "yes" | "no" | "dismissed"

/**
 * Slash commands.
 *
 * Each one is a phrasing of something the assistant can already do — they send
 * a normal message rather than calling a tool directly, so the agent still
 * decides how to answer and the transcript reads the same as if it had been
 * typed out. Commands that need a subject leave the draft open for it instead
 * of guessing.
 */
const COMMANDS: Array<{
  cmd: string
  label: string
  hint: string
  prompt: string
  /// Leaves the prompt in the composer for the user to finish.
  takesArgument?: boolean
}> = [
  {
    cmd: "/statements",
    label: "Fetch bank statements",
    hint: "Finds them in your mail and unlocks them with your vault",
    prompt:
      "Fetch my bank statements from email and show me what you found before importing anything.",
  },
  {
    cmd: "/import",
    label: "Read a sheet or doc",
    hint: "Paste a Google Sheet or Doc link after the command",
    prompt: "Read this and tell me what is in it before creating anything: ",
    takesArgument: true,
  },
  {
    cmd: "/agenda",
    label: "What needs attention",
    hint: "Overdue, due today, waiting, in progress",
    prompt: "What needs my attention right now?",
  },
  {
    cmd: "/next",
    label: "What should I do next",
    hint: "One task, with the reasoning",
    prompt: "What is the single best thing for me to work on next, and why?",
  },
  {
    cmd: "/spend",
    label: "Spending summary",
    hint: "Last 30 days, by category",
    prompt: "Show my spending for the last 30 days broken down by category.",
  },
  {
    cmd: "/bills",
    label: "Upcoming payments",
    hint: "Subscriptions and recurring charges due soon",
    prompt: "What payments are coming up in the next 30 days?",
  },
  {
    cmd: "/sync",
    label: "Sync Gmail",
    hint: "Pull the latest mail into the workspace",
    prompt: "Sync my Gmail now and tell me what came in.",
  },
  {
    cmd: "/remember",
    label: "Remember something",
    hint: "Save a preference or fact for later conversations",
    prompt: "Remember this about how I work: ",
    takesArgument: true,
  },
  {
    cmd: "/recall",
    label: "What do you know about me",
    hint: "Read back what has been remembered",
    prompt: "What do you already know about how I work?",
  },
]

export function AssistantPanel({
  workspace,
  onFocusTask,
}: {
  workspace: string
  onFocusTask?: (taskId: string) => void
}) {
  const [initialData, setInitialData] = useState<{
    loaded: boolean
    conversationId?: string
    messages: UIMessage[]
  }>({ loaded: false, messages: [] })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/agent/${workspace}`)
      .then((res) => (res.ok ? res.json() : { messages: [] }))
      .then((data) => {
        if (!cancelled) {
          setInitialData({
            loaded: true,
            conversationId: data.conversationId,
            // JSON has no date type, so the API sends ISO strings while
            // UIMessage.createdAt is a Date. Reviving it here is what stops
            // "e.createdAt.toISOString is not a function" from killing the
            // chat on every hard refresh.
            messages: (
              (data.messages ?? []) as Array<
                Omit<UIMessage, "createdAt"> & { createdAt?: string }
              >
            ).map((message) => ({
              ...message,
              createdAt: message.createdAt
                ? new Date(message.createdAt)
                : new Date(),
            })),
          })
        }
      })
      .catch(() => {
        if (!cancelled) setInitialData({ loaded: true, messages: [] })
      })

    return () => {
      cancelled = true
    }
  }, [workspace])

  if (!initialData.loaded) {
    return (
      <Card className="flex h-full min-h-0 flex-col border bg-card/60">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>AI Chief-of-Staff</span>
            <Spinner className="size-3 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center p-4">
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles className="size-5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">AI Chief-of-Staff Cockpit</h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              Connecting live database session & real-time agent multi-bus...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AssistantChatInner
      key={initialData.conversationId || "active"}
      workspace={workspace}
      initialMessages={initialData.messages}
      onFocusTask={onFocusTask}
      onNewThread={() => {
        fetch(`/api/agent/${workspace}`, { method: "DELETE" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            setInitialData({
              loaded: true,
              conversationId: data?.conversationId || String(Date.now()),
              messages: [],
            })
          })
          .catch(() => {
            setInitialData({
              loaded: true,
              conversationId: String(Date.now()),
              messages: [],
            })
          })
      }}
    />
  )
}

function AssistantChatInner({
  workspace,
  initialMessages,
  onFocusTask,
  onNewThread,
}: {
  workspace: string
  initialMessages: UIMessage[]
  onFocusTask?: (taskId: string) => void
  onNewThread?: () => void
}) {
  const [draft, setDraft] = useState("")
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null)
  const [commandIndex, setCommandIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  // The menu is open whenever the draft is a bare "/word" — one token, no
  // space — so a message that merely contains a slash never triggers it.
  const commandQuery = /^\/\S*$/.test(draft) ? draft.slice(1).toLowerCase() : null
  const commandMatches =
    commandQuery === null
      ? []
      : COMMANDS.filter(
          (command) =>
            command.cmd.slice(1).startsWith(commandQuery) ||
            command.label.toLowerCase().includes(commandQuery)
        )

  function runCommand(command: (typeof COMMANDS)[number]) {
    if (command.takesArgument) {
      setDraft(command.prompt)
      composerRef.current?.focus()
      return
    }
    setDraft("")
    submit(command.prompt)
  }

  const [pending, setPending] = useState<{
    question: string
    answer: (answer: ConfirmAnswer) => void
  } | null>(null)

  useEffect(() => {
    if (focusedTaskId) onFocusTask?.(focusedTaskId)
  }, [focusedTaskId, onFocusTask])

  const chatOptions = useMemo(() => {
    const focusTask = focusTaskDef.client((input) => {
      setFocusedTaskId(input.taskId)
      return { focused: true }
    })

    const confirmWithUser = confirmWithUserDef.client(
      (input) =>
        new Promise<{ answer: ConfirmAnswer }>((resolve) => {
          setPending({
            question: input.question,
            answer: (answer) => {
              setPending(null)
              resolve({ answer })
            },
          })
        })
    )

    return createChatClientOptions({
      // Cast on purpose. `UIMessage`'s tool generic defaults to `any`, and
      // letting this array take part in inference pins the whole client to it —
      // which collapses the approval-interrupt union to `never` and takes the
      // send_email banner with it. The `tools` argument below is what should
      // drive that inference, and only it.
      initialMessages: initialMessages as never,
      connection: fetchServerSentEvents(`/api/agent/${workspace}`),
      // `update_task` is deliberately absent: it is a server tool that no
      // longer needs approval, and registering it here would tell the browser
      // it is client-runnable. Sending mail is the only interrupt left.
      tools: clientTools(focusTask, confirmWithUser, sendEmailDef.client()),
    })
  }, [workspace, initialMessages])

  const {
    messages,
    sendMessage,
    isLoading,
    error,
    stop,
    reload,
    // Without these an approval-gated tool pauses the run forever: the server
    // parks on the interrupt and nothing on this side ever answers it.
    interrupts,
    resolveInterrupts,
    cancelInterrupts,
    resuming,
  } = useChat(chatOptions)

  // ScrollArea puts the ref on its Root, but the element that actually scrolls
  // is the Viewport nested inside it — setting scrollTop on the Root is a
  // no-op, which is why the chat never followed the stream.
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [messages, isLoading])

  function submit(customContent?: string) {
    const content = (customContent || draft).trim()
    if (!content) return
    if (isLoading) {
      try { stop() } catch {}
    }
    setDraft("")
    void sendMessage(content)
  }

  const starterWidgets = [
    {
      title: "Show financial metrics & category breakdown table",
      icon: CreditCard,
      prompt: "Show me my financial spending metrics and breakdown by category for the last 30 days.",
    },
    {
      title: "Show spend distribution chart",
      icon: BarChart3,
      prompt: "Show me a chart of my recent spending breakdown across software, hosting, and operations.",
    },
    {
      title: "Show task briefing with interactive checklist",
      icon: ListTodo,
      prompt: "What is my next best task right now? Show me the action items checklist with tick boxes.",
    },
    {
      title: "Show client profile info card",
      icon: FileText,
      prompt: "Show me the info card for our active client and project deliverable status.",
    },
    {
      title: "Ask project intake questionnaire",
      icon: HelpCircle,
      prompt: "Ask me a questionnaire to collect details for a new client project brief.",
    },
  ]

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <span>AI Chief-of-Staff</span>
          {isLoading ? <Spinner className="size-3 text-primary" /> : null}
          {focusedTaskId ? (
            <Badge variant="secondary" className="font-mono text-[0.625rem]">
              focused
            </Badge>
          ) : null}
        </CardTitle>

        <div className="flex items-center gap-1.5">
          {onNewThread ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewThread}
              title="Start a new conversation thread in database"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3.5" />
              <span>New Thread</span>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <ScrollArea ref={scrollRef} className="min-h-0 flex-1 pr-3">
          <div className="flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="space-y-1">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="size-5" />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">AI Chief-of-Staff Cockpit</h2>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Interactive multi-agent orchestrator backed by PostgreSQL & Redis. Real-time markdown, tables, charts, metrics, and questionnaires.
                  </p>
                </div>

                {/* Interactive Starter Quick Buttons */}
                <div className="grid gap-2 w-full max-w-md pt-2">
                  {starterWidgets.map((starter) => {
                    const Icon = starter.icon
                    return (
                      <button
                        key={starter.title}
                        onClick={() => submit(starter.prompt)}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card/60 hover:border-primary/50 hover:bg-muted/40 transition-all text-left group"
                      >
                        <div className="size-6 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 text-primary transition-colors">
                          <Icon className="size-3.5" />
                        </div>
                        <span className="text-xs font-medium text-foreground line-clamp-1">{starter.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1.5 text-xs leading-relaxed",
                  message.role === "user" && "items-end"
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={index}
                        className={cn(
                          "max-w-[90%] rounded-lg px-3 py-2 text-xs",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-muted/60 border text-foreground"
                        )}
                      >
                        {message.role === "user" ? (
                          <div className="whitespace-pre-wrap text-xs leading-relaxed">
                            {part.content}
                          </div>
                        ) : (
                          <RichContent
                            content={part.content}
                            onQuestionnaireSubmit={(text) => void sendMessage(text)}
                          />
                        )}
                      </div>
                    )
                  }

                  // Tool execution indicator
                  if (part.type === "tool-call") {
                    const toolPart = part as { name: string; state?: string; args?: unknown; result?: unknown }
                    return (
                      <ToolExecutionPill
                        key={index}
                        name={toolPart.name}
                        state={toolPart.state}
                        args={toolPart.args}
                        result={toolPart.result}
                      />
                    )
                  }

                  return null
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Approval interrupts — the run is parked until one of these is answered */}
        {interrupts.length > 0 ? (
          <div className="space-y-2">
            {interrupts.map((interrupt, index) => {
              // The union also carries generic and unbound interrupts, which
              // have no tool identity and no bound resolver — those fall back
              // to the chat-level resolver.
              const approval =
                interrupt.kind === "tool-approval" ? interrupt : null
              const toolName = approval?.toolName ?? "this step"

              const answer = (approved: boolean) => {
                if (approval) approval.resolveInterrupt(approved)
                else resolveInterrupts(approved)
              }

              return (
                <div
                  key={approval?.toolCallId ?? `interrupt-${index}`}
                  className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-xs space-y-2"
                >
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldAlert className="size-3.5 text-amber-500 shrink-0" />
                    <span>
                      Approve <span className="font-mono">{toolName}</span>?
                    </span>
                  </div>

                  {approval?.originalArgs ? (
                    <pre className="max-h-40 overflow-auto rounded bg-muted/60 p-2 text-[0.625rem] leading-relaxed whitespace-pre-wrap break-words">
                      {JSON.stringify(approval.originalArgs, null, 2)}
                    </pre>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={resuming}
                      onClick={() => answer(true)}
                      className="h-7 text-xs"
                    >
                      {resuming ? "Sending…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resuming}
                      onClick={() => answer(false)}
                      className="h-7 text-xs"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={resuming}
                      onClick={() => cancelInterrupts()}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Cancel run
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Human-in-the-loop confirmation banner */}
        {pending ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs space-y-2">
            <div className="font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>{pending.question}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => pending.answer("yes")}
                className="h-7 text-xs"
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => pending.answer("no")}
                className="h-7 text-xs"
              >
                No
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => pending.answer("dismissed")}
                className="h-7 text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="py-2">
            <div className="flex items-center justify-between gap-2">
              <AlertDescription className="text-xs">
                {error instanceof Error ? error.message : String(error)}
              </AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  try { stop() } catch {}
                  void reload()
                }}
                className="h-6 text-[0.6875rem] px-2 shrink-0 bg-background/80"
              >
                Retry
              </Button>
            </div>
          </Alert>
        ) : null}

        {/* Composer */}
        <div className="relative flex gap-2 pt-1 border-t">
          {commandMatches.length > 0 ? (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-lg border bg-popover shadow-md">
              <div className="max-h-64 overflow-y-auto py-1">
                {commandMatches.map((command, index) => (
                  <button
                    key={command.cmd}
                    type="button"
                    onMouseEnter={() => setCommandIndex(index)}
                    onClick={() => runCommand(command)}
                    className={cn(
                      "flex w-full items-baseline gap-2 px-3 py-1.5 text-left transition-colors",
                      index === commandIndex ? "bg-muted" : "hover:bg-muted/60"
                    )}
                  >
                    <span className="font-mono text-[0.6875rem] font-medium text-primary shrink-0">
                      {command.cmd}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {command.label}
                    </span>
                    <span className="ml-auto hidden truncate text-[0.625rem] text-muted-foreground sm:block">
                      {command.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setCommandIndex(0)
            }}
            onKeyDown={(e) => {
              if (commandMatches.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setCommandIndex((i) => (i + 1) % commandMatches.length)
                  return
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setCommandIndex(
                    (i) => (i - 1 + commandMatches.length) % commandMatches.length
                  )
                  return
                }
                if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                  e.preventDefault()
                  runCommand(commandMatches[commandIndex])
                  return
                }
                if (e.key === "Escape") {
                  e.preventDefault()
                  setDraft("")
                  return
                }
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask anything, or type / for commands (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="min-h-9 flex-1 resize-none text-xs"
          />
          {isLoading ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => stop()}
              aria-label="Stop generation"
              className="size-9 shrink-0"
            >
              <SquareIcon className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => submit()}
              disabled={!draft.trim()}
              aria-label="Send message"
              className="size-9 shrink-0"
            >
              <SendIcon className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
