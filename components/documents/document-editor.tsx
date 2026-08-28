"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Sparkles,
  Download,
  Check,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Loader2,
  TableIcon,
  Wand2,
  MessageSquare,
  Copy,
  Info,
  CheckSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { ShareButton } from "@/components/share/share-button"
import { updateDocumentAction } from "@/lib/actions/entities"
import { tiptapToPlainText } from "@/lib/utils/tiptap-text"
import { aiEditorChatAction } from "@/lib/actions/ai-editor"
import { cn } from "@/lib/utils"

type DocData = {
  id: string
  title: string
  content: string | null
  summary: string | null
  file: { id: string; name: string; sizeBytes: number; mimeType: string } | null
  shareToken: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

type ChatMessage = {
  role: "user" | "assistant"
  text: string
  tiptap?: unknown
}

export function DocumentEditor({
  workspace,
  initialDoc,
}: {
  workspace: string
  initialDoc: DocData
}) {
  const router = useRouter()
  const [editor, setEditor] = React.useState<any>(null)
  const [title, setTitle] = React.useState(initialDoc.title)
  const [summary, setSummary] = React.useState(initialDoc.summary || "")
  const [content, setContent] = React.useState<any>(initialDoc.content || "")
  const [saving, startSave] = React.useTransition()
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"chat" | "details">("chat")

  // AI Editor Chat State
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "I’m your Document AI Assistant. Ask me to draft sections, summarize, create structured tables, or rewrite selected text.",
    },
  ])
  const [input, setInput] = React.useState("")
  const [aiPending, setAiPending] = React.useState(false)
  const chatScrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, aiPending])

  const getPlainSelection = () => {
    try {
      const { from, to } = editor?.state.selection ?? {}
      if (from === undefined || to === undefined || from === to) return ""
      const text = editor?.state.doc.textBetween(from, to, " ") ?? ""
      return text.trim().slice(0, 2000)
    } catch {
      return ""
    }
  }

  const getPlainDoc = () => {
    try {
      return tiptapToPlainText(editor?.getJSON() ?? content).slice(0, 5000)
    } catch {
      return ""
    }
  }

  async function handleSendPrompt(promptOverride?: string) {
    const p = (promptOverride ?? input).trim()
    if (!p) return
    setInput("")

    // Instant local table generator
    if (p.toLowerCase().includes("table") && editor) {
      const dim = p.match(/(\d+)\s*[x×]\s*(\d+)/)
      const rows = dim ? Math.min(10, Math.max(1, parseInt(dim[1], 10))) : 3
      const cols = dim ? Math.min(8, Math.max(1, parseInt(dim[2], 10))) : 3
      const tiptap = {
        type: "table",
        content: Array.from({ length: rows }).map((_, r) => ({
          type: "tableRow",
          content: Array.from({ length: cols }).map((__, c) => ({
            type: r === 0 ? "tableHeader" : "tableCell",
            attrs: { colspan: 1, rowspan: 1, colwidth: null },
            content: [
              {
                type: "paragraph",
                content: r === 0 ? [{ type: "text", text: `Header ${c + 1}` }] : [],
              },
            ],
          })),
        })),
      }
      editor.chain().focus().insertContent(tiptap).run()
      setMessages((m) => [
        ...m,
        { role: "user", text: p },
        {
          role: "assistant",
          text: `Created ${rows}×${cols} table inside the document canvas. You can edit cells directly.`,
        },
      ])
      return
    }

    setMessages((m) => [...m, { role: "user", text: p }])
    setAiPending(true)

    try {
      const editorJson = editor?.getJSON() ?? content
      const selectionText = getPlainSelection()
      const res: any = await aiEditorChatAction(workspace, {
        prompt: p,
        editorJson,
        selectionText,
      })

      if (res?.ok) {
        const data = res.data
        if (data?.tiptap && data.tiptap.type === "table" && editor) {
          editor.chain().focus().insertContent(data.tiptap).run()
        }
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data?.text || "Done!",
            tiptap: data?.tiptap,
          },
        ])
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: res?.error || "Sorry, I encountered an issue processing your request.",
          },
        ])
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: e?.message || "Failed to communicate with AI service.",
        },
      ])
    } finally {
      setAiPending(false)
    }
  }

  function insertIntoDoc(text: string) {
    if (!editor || !text) return
    editor.chain().focus().insertContent(`<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`).run()
  }

  function handleSave() {
    setErrorMsg(null)
    startSave(async () => {
      const fd = new FormData()
      fd.append("id", initialDoc.id)
      fd.append("title", title)
      fd.append("summary", summary)

      const contentStr =
        typeof content === "object" ? JSON.stringify(content) : String(content || "")
      fd.append("content", contentStr)

      const res = await updateDocumentAction(workspace, fd)
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        router.refresh()
      } else {
        setErrorMsg(res.error || "Failed to save changes")
      }
    })
  }

  // Keyboard shortcut: Cmd/Ctrl + S to save
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="w-full h-[calc(100dvh-4.25rem)] md:h-[calc(100dvh-4.75rem)] flex flex-col overflow-hidden bg-background">
      {/* 1. FIXED TOP HEADER BAR */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 md:px-6 border-b bg-card/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/w/${workspace}/documents`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Documents</span>
          </Link>
          <span className="text-muted-foreground/30 hidden sm:inline">/</span>
          <Badge variant="outline" className="text-[10px] font-mono shrink-0 hidden sm:inline-flex">
            {initialDoc.file ? "File Backed" : "Live Document"}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono truncate hidden lg:inline">
            · ID {initialDoc.id.slice(-8)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShareButton
            workspace={workspace}
            documentId={initialDoc.id}
            initialToken={initialDoc.shareToken}
            initialPublic={initialDoc.isPublic}
          />

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-sm transition-all",
              saveSuccess ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground"
            )}
          >
            {saveSuccess ? (
              <>
                <Check className="size-3.5 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
                <kbd className="hidden sm:inline-block ml-1 text-[10px] bg-primary-foreground/20 px-1 py-0.5 rounded font-mono">
                  ⌘S
                </kbd>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="size-8 text-muted-foreground hover:text-foreground hidden md:inline-flex"
            title={sidebarOpen ? "Hide AI Sidebar" : "Show AI Sidebar"}
          >
            {sidebarOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </Button>
        </div>
      </header>

      {errorMsg ? (
        <div className="shrink-0 p-2.5 mx-4 md:mx-6 mt-2 text-xs rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {/* 2. MAIN WORKSPACE: CANVAS + AI ASSISTANT SIDEBAR */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Document Editing Canvas Column */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 p-3 sm:p-4 md:p-6 w-full max-w-full">
          {/* Document Title Header */}
          <div className="shrink-0 mb-3 space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Document..."
              className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight border-none bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/40 h-auto py-0.5 break-words"
            />
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>Updated {new Date(initialDoc.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <span>·</span>
              <span>
                {typeof content === "string"
                  ? content.length
                  : JSON.stringify(content).length}{" "}
                chars
              </span>
            </div>
          </div>

          {/* Tiptap Editor Canvas: ONLY this area scrolls internally */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <TiptapEditor
              value={content}
              onChange={(val) => setContent(val)}
              onReady={(ed) => setEditor(ed)}
              placeholder="Start authoring requirements, specifications, deliverables or paste client brief details…"
              className="h-full border-none rounded-none"
              editorClassName="h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8"
            />
          </div>
        </main>

        {/* 3. RIGHT SIDEBAR: AI ASSISTANT CHAT & METADATA */}
        {sidebarOpen ? (
          <aside className="w-80 md:w-96 shrink-0 border-l bg-card/60 flex flex-col overflow-hidden hidden md:flex backdrop-blur-sm">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="shrink-0 p-2.5 border-b bg-muted/20">
                <TabsList className="grid w-full grid-cols-2 h-7 text-xs">
                  <TabsTrigger value="chat" className="text-xs gap-1.5">
                    <Sparkles className="size-3 text-primary" />
                    <span>AI Assistant</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="text-xs gap-1.5">
                    <FileText className="size-3" />
                    <span>Context &amp; File</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: AI EDITOR CHAT */}
              <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0 data-[state=inactive]:hidden">
                {/* Quick action prompt pills */}
                <div className="shrink-0 p-2 border-b bg-muted/10 flex flex-wrap gap-1.5">
                  {[
                    { label: "Read doc", prompt: "read doc and summarize key points", icon: MessageSquare },
                    { label: "Rewrite selection", prompt: "rewrite selection to be concise and professional", icon: Wand2 },
                    { label: "Table 3×3", prompt: "create 3x3 table with headers", icon: TableIcon },
                    { label: "Checklist", prompt: "extract action items as a markdown checklist", icon: CheckSquare },
                  ].map((a) => {
                    const Icon = a.icon
                    return (
                      <Button
                        key={a.label}
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] px-2 gap-1 rounded-md bg-background hover:bg-muted font-normal"
                        onClick={() => handleSendPrompt(a.prompt)}
                        disabled={aiPending}
                      >
                        <Icon className="size-3 text-primary" />
                        <span>{a.label}</span>
                      </Button>
                    )
                  })}
                </div>

                {/* Message stream */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap transition-all",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground ml-6 shadow-xs"
                          : "bg-muted/40 border mr-3 shadow-xs"
                      )}
                    >
                      <div className="font-semibold text-[10px] opacity-70 mb-1 flex items-center justify-between">
                        <span>{m.role === "user" ? "You" : "AI Assistant"}</span>
                      </div>
                      <div className="text-xs leading-relaxed">{m.text}</div>
                      {m.role === "assistant" && m.text && idx > 0 ? (
                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] gap-1 hover:bg-background"
                            onClick={() => insertIntoDoc(m.text)}
                          >
                            <Send className="size-3" />
                            <span>Insert into canvas</span>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {aiPending ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/20 border">
                      <Loader2 className="size-3.5 animate-spin text-primary" />
                      <span>Reading document &amp; thinking...</span>
                    </div>
                  ) : null}
                </div>

                {/* Chat Input */}
                <div className="shrink-0 p-2.5 border-t bg-card flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendPrompt()
                        }
                      }}
                      placeholder="Ask AI: 'create table', 'rewrite selection'..."
                      className="h-8 text-xs flex-1 bg-background"
                      disabled={aiPending}
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1"
                      onClick={() => handleSendPrompt()}
                      disabled={aiPending || !input.trim()}
                    >
                      <Send className="size-3" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight px-1">
                    Tip: Highlight text in doc, then click <strong>Rewrite selection</strong>.
                  </p>
                </div>
              </TabsContent>

              {/* TAB 2: METADATA, CONTEXT & FILE */}
              <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4 m-0 data-[state=inactive]:hidden">
                {/* AI Semantic Summary */}
                <Card className="border-border/80 bg-card shadow-none">
                  <CardHeader className="p-3.5 pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>AI Semantic Context</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3.5 pt-1 space-y-2">
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Key facts and takeaways extracted for AI agent context packs…"
                      rows={6}
                      className="text-xs resize-none bg-muted/30 font-sans leading-relaxed"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Included in agent Context Packs so assistants can answer client questions.
                    </p>
                  </CardContent>
                </Card>

                {/* Attached File Object */}
                {initialDoc.file ? (
                  <Card className="border-border/80 bg-card shadow-none">
                    <CardHeader className="p-3.5 pb-2">
                      <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span>Underlying File</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1 space-y-2.5 text-xs">
                      <div className="p-2.5 rounded-lg border bg-muted/30 space-y-0.5">
                        <p className="font-medium text-foreground truncate">{initialDoc.file.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {(initialDoc.file.sizeBytes / 1024).toFixed(1)} KB · {initialDoc.file.mimeType}
                        </p>
                      </div>
                      <a
                        href={`/api/files/${workspace}/${initialDoc.file.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 h-7.5 rounded-md border bg-background text-xs font-medium hover:bg-muted transition-colors text-primary"
                      >
                        <Download className="size-3.5" />
                        <span>Download Original</span>
                      </a>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            </Tabs>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
