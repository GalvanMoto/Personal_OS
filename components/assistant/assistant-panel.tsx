"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { clientTools } from "@tanstack/ai-client"
import {
  createChatClientOptions,
  fetchServerSentEvents,
  useChat,
} from "@tanstack/ai-react"
import {
  BarChart3,
  CheckIcon,
  CreditCard,
  FileCheck,
  FileText,
  HelpCircle,
  ListTodo,
  Plus,
  SendIcon,
  Sparkles,
  SquareIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  confirmWithUserDef,
  deleteTaskDef,
  focusTaskDef,
  sendEmailDef,
  updateTaskDef,
} from "@/lib/ai/agent/definitions"
import { RichContent } from "@/components/assistant/rich-content"
import { cn } from "@/lib/utils"

type ConfirmAnswer = "yes" | "no" | "dismissed"

/**
 * The assistant surface with local storage persistence and session resumption.
 */
export function AssistantPanel({
  workspace,
  onFocusTask,
}: {
  workspace: string
  onFocusTask?: (taskId: string) => void
}) {
  const [draft, setDraft] = useState("")
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const storageKey = `personal_os_chat_${workspace}`

  // 1. Initial messages from persistent local storage
  const [initialMessages] = useState<any[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // The client tool returns a promise the agent loop awaits, and the resolver
  // is carried in state alongside the question. That is what makes asking the
  // user a real interrupt rather than a message the model talks past.
  const [pending, setPending] = useState<{
    question: string
    answer: (answer: ConfirmAnswer) => void
  } | null>(null)

  // Reported to the parent from an effect rather than from inside the tool, so
  // a caller passing an inline function cannot tear down the chat connection.
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
      initialMessages,
      connection: fetchServerSentEvents(`/api/agent/${workspace}`),
      tools: clientTools(
        focusTask,
        confirmWithUser,
        // Registered with no implementation on purpose. These execute on the
        // server; the client only needs to know they are approval-gated so the
        // interrupt arrives here typed and renderable.
        updateTaskDef.client(),
        deleteTaskDef.client(),
        sendEmailDef.client()
      ),
    })
  }, [workspace, initialMessages])

  const { messages, sendMessage, interrupts, isLoading, error, stop, resuming } =
    useChat(chatOptions)

  // Save messages to local storage whenever conversation progresses
  useEffect(() => {
    if (typeof window === "undefined") return
    if (messages && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages))
      } catch (err) {
        console.error("Failed to save chat:", err)
      }
    }
  }, [messages, storageKey])

  function submit(customContent?: string) {
    const content = (customContent || draft).trim()
    if (!content || isLoading) return
    setDraft("")
    void sendMessage(content)
  }

  function handleClearChat() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey)
      } catch (err) {
        console.error(err)
      }
      window.location.reload()
    }
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
          {messages.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              title="Start a new conversation thread"
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
                    Interactive multi-agent orchestrator with live markdown, tables, charts, metrics, info cards, tick boxes, and questionnaires.
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
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 text-muted-foreground my-0.5"
                      >
                        <Badge variant="outline" className="font-mono text-[0.625rem]">
                          {part.name}
                        </Badge>
                        <span className="text-[0.625rem]">{part.state}</span>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Approval interrupts */}
        {interrupts.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Separator />
            {interrupts.map((interrupt) => {
              if (interrupt.kind !== "tool-approval") return null

              return (
                <div
                  key={interrupt.id}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
                >
                  <p className="font-medium text-amber-500">
                    Approval required: {interrupt.toolName}
                  </p>
                  <pre className="mt-1 max-h-32 overflow-x-auto rounded bg-background/60 p-1.5 font-mono text-[0.625rem]">
                    {JSON.stringify(interrupt.originalArgs, null, 2)}
                  </pre>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => interrupt.resolveInterrupt(true)}
                      className="h-7 text-xs"
                    >
                      <CheckIcon className="size-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => interrupt.resolveInterrupt(false)}
                      className="h-7 text-xs"
                    >
                      <XIcon className="size-3" /> Reject
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {/* Question interrupts */}
        {pending ? (
          <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs">
            <p className="font-medium">{pending.question}</p>
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
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Composer */}
        <div className="flex gap-2 pt-1 border-t">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Ask, or paste anything to capture it... (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={isLoading || Boolean(pending)}
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
              disabled={!draft.trim() || Boolean(pending)}
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
