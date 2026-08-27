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
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { ToolExecutionPill } from "./tool-execution-pill"
import { cn } from "@/lib/utils"

type ConfirmAnswer = "yes" | "no" | "dismissed"

export function AssistantPanel({
  workspace,
  onFocusTask,
}: {
  workspace: string
  onFocusTask?: (taskId: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span>AI Chief-of-Staff</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
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
          </div>
        </CardContent>
      </Card>
    )
  }

  return <AssistantChatInner workspace={workspace} onFocusTask={onFocusTask} />
}

function AssistantChatInner({
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

  // Load initial messages from local storage
  const initialMessages = useMemo(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }, [storageKey])

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
      initialMessages,
      connection: fetchServerSentEvents(`/api/agent/${workspace}`),
      tools: clientTools(
        focusTask,
        confirmWithUser,
        updateTaskDef.client(),
        deleteTaskDef.client(),
        sendEmailDef.client()
      ),
    })
  }, [workspace, initialMessages])

  const { messages, sendMessage, isLoading, error, stop } = useChat(chatOptions)

  // Save messages to local storage
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

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
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
                  window.location.reload()
                }}
                className="h-6 text-[0.6875rem] px-2 shrink-0 bg-background/80"
              >
                Reset Chat
              </Button>
            </div>
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
            disabled={isLoading}
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
