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
  Bot,
  CreditCard,
  FileSearch,
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Progress } from "@/components/ui/progress"
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

/// Mirrors `maxToolCalls(24)` in the agent loop strategy, so the progress bar
/// measures the run against the budget that will actually stop it.
const TOOL_CALL_BUDGET = 24

/**
 * Slash commands.
 *
 * Each is a phrasing of something the assistant can already do — they send a
 * normal message rather than calling a tool directly, so the agent still
 * decides how to answer and the transcript reads the same as if it had been
 * typed by hand. Commands needing a subject leave the draft open for it.
 */
const COMMANDS: Array<{
  cmd: string
  label: string
  hint: string
  prompt: string
  takesArgument?: boolean
}> = [
  {
    cmd: "/statements",
    label: "Fetch bank statements",
    hint: "Finds them in mail, unlocks them from your vault",
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
    hint: "Subscriptions and charges due soon",
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
    hint: "Save a preference for later conversations",
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
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <span>AI Chief-of-Staff</span>
            <Spinner className="size-3 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 items-center justify-center p-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Restoring your thread</EmptyTitle>
              <EmptyDescription>
                Loading this workspace&rsquo;s conversation history.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
  const composerRef = useRef<HTMLTextAreaElement>(null)

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

  // How far into its tool budget the current run has gone. Counted from the
  // transcript rather than tracked separately, so it cannot drift.
  const toolCallsUsed = useMemo(
    () =>
      messages
        .filter((message) => message.role === "assistant")
        .reduce(
          (total, message) =>
            total +
            message.parts.filter((part) => part.type === "tool-call").length,
          0
        ),
    [messages]
  )

  const commandQuery = /^\/\S*$/.test(draft) ? draft.slice(1).toLowerCase() : null
  const commandMatches =
    commandQuery === null
      ? []
      : COMMANDS.filter(
          (command) =>
            command.cmd.slice(1).startsWith(commandQuery) ||
            command.label.toLowerCase().includes(commandQuery)
        )

  function submit(customContent?: string) {
    const content = (customContent || draft).trim()
    if (!content) return
    if (isLoading) {
      try {
        stop()
      } catch {}
    }
    setDraft("")
    void sendMessage(content)
  }

  function runCommand(command: (typeof COMMANDS)[number]) {
    if (command.takesArgument) {
      setDraft(command.prompt)
      composerRef.current?.focus()
      return
    }
    setDraft("")
    submit(command.prompt)
  }

  const starters = [
    {
      title: "Fetch my bank statements",
      description: "Unlocks password-protected PDFs from your vault",
      icon: FileSearch,
      prompt:
        "Fetch my bank statements from email and show me what you found before importing.",
    },
    {
      title: "What should I do next?",
      description: "One task, with the reasoning behind it",
      icon: ListTodo,
      prompt:
        "What is my next best task right now? Show the action items as a checklist.",
    },
    {
      title: "Where did my money go?",
      description: "Spending metrics and a category breakdown",
      icon: CreditCard,
      prompt:
        "Show me my spending metrics and breakdown by category for the last 30 days.",
    },
    {
      title: "Chart my spend distribution",
      description: "Across software, hosting and operations",
      icon: BarChart3,
      prompt:
        "Show me a chart of my recent spending across software, hosting and operations.",
    },
    {
      title: "Start a project intake",
      description: "A short questionnaire for a new client brief",
      icon: HelpCircle,
      prompt: "Ask me a questionnaire to collect details for a new client brief.",
    },
  ]

  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span>AI Chief-of-Staff</span>
          {isLoading ? <Spinner className="size-3 text-primary" /> : null}
          {focusedTaskId ? (
            <Badge variant="secondary" className="font-mono text-[0.625rem]">
              focused
            </Badge>
          ) : null}
        </CardTitle>

        {onNewThread ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewThread}
            title="Start a new conversation thread"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New thread</span>
          </Button>
        ) : null}
      </CardHeader>

      {/* Only while a run is live — the budget is what will stop it, so showing
          progress against it tells the user something they can act on. */}
      {isLoading ? (
        <Progress
          value={Math.min(100, (toolCallsUsed / TOOL_CALL_BUDGET) * 100)}
          className="h-0.5 rounded-none"
        />
      ) : null}

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="px-4 py-4">
              <MessageScrollerContent className="gap-4">
                {messages.length === 0 ? (
                  <Empty className="border-none">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Sparkles />
                      </EmptyMedia>
                      <EmptyTitle>What can I get started on?</EmptyTitle>
                      <EmptyDescription>
                        I can read your mail, unlock statements, plan your day
                        and remember how you like to work.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent className="w-full max-w-md">
                      {starters.map((starter) => {
                        const Icon = starter.icon
                        return (
                          <Item
                            key={starter.title}
                            variant="outline"
                            size="sm"
                            render={
                              <button
                                type="button"
                                onClick={() => submit(starter.prompt)}
                                className="w-full cursor-pointer text-left"
                              />
                            }
                          >
                            <ItemMedia variant="icon">
                              <Icon />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>{starter.title}</ItemTitle>
                              <ItemDescription>
                                {starter.description}
                              </ItemDescription>
                            </ItemContent>
                          </Item>
                        )
                      })}
                    </EmptyContent>
                  </Empty>
                ) : null}

                {messages.map((message, messageIndex) => {
                  const isUser = message.role === "user"

                  return (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={messageIndex === messages.length - 1}
                    >
                      <Message align={isUser ? "end" : "start"}>
                        {isUser ? null : (
                          <MessageAvatar className="size-7 min-w-7 bg-primary/10 text-primary">
                            <Bot className="size-3.5" />
                          </MessageAvatar>
                        )}

                        <MessageContent>
                          {message.parts.map((part, index) => {
                            if (part.type === "text") {
                              return (
                                <Bubble
                                  key={index}
                                  align={isUser ? "end" : "start"}
                                  variant={isUser ? "default" : "muted"}
                                >
                                  <BubbleContent
                                    className={cn(
                                      "max-w-[92%]",
                                      isUser && "whitespace-pre-wrap"
                                    )}
                                  >
                                    {isUser ? (
                                      part.content
                                    ) : (
                                      <RichContent
                                        content={part.content}
                                        onQuestionnaireSubmit={(text) =>
                                          void sendMessage(text)
                                        }
                                      />
                                    )}
                                  </BubbleContent>
                                </Bubble>
                              )
                            }

                            if (part.type === "tool-call") {
                              const toolPart = part as {
                                name: string
                                state?: string
                              }
                              return (
                                <ToolExecutionPill
                                  key={index}
                                  name={toolPart.name}
                                  state={toolPart.state}
                                />
                              )
                            }

                            return null
                          })}
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="space-y-2 px-4 pb-4">
          {/* Approval interrupts — the run is parked until one is answered */}
          {interrupts.map((interrupt, index) => {
            // The union also carries generic and unbound interrupts, which have
            // no tool identity and no bound resolver — those fall back to the
            // chat-level resolver.
            const approval = interrupt.kind === "tool-approval" ? interrupt : null
            const toolName = approval?.toolName ?? "this step"

            const answer = (approved: boolean) => {
              if (approval) approval.resolveInterrupt(approved)
              else resolveInterrupts(approved)
            }

            return (
              <div
                key={approval?.toolCallId ?? `interrupt-${index}`}
                className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-xs"
              >
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldAlert className="size-3.5 shrink-0 text-amber-500" />
                  <span>
                    Approve <span className="font-mono">{toolName}</span>?
                  </span>
                </div>

                {approval?.originalArgs ? (
                  <pre className="max-h-40 overflow-auto rounded bg-muted/60 p-2 text-[0.625rem]/relaxed break-words whitespace-pre-wrap">
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

          {pending ? (
            <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
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
                    try {
                      stop()
                    } catch {}
                    void reload()
                  }}
                  className="h-6 shrink-0 bg-background/80 px-2 text-[0.6875rem]"
                >
                  Retry
                </Button>
              </div>
            </Alert>
          ) : null}

          {/* Composer */}
          <div className="relative flex gap-2 border-t pt-3">
            {commandMatches.length > 0 ? (
              <div className="absolute right-0 bottom-full left-0 z-10 mb-2 overflow-hidden rounded-lg border bg-popover shadow-md">
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
                      <span className="shrink-0 font-mono text-[0.6875rem] font-medium text-primary">
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
                      (i) =>
                        (i - 1 + commandMatches.length) % commandMatches.length
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
              placeholder="Ask anything, or type / for commands"
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
        </div>
      </CardContent>
    </Card>
  )
}
