"use client"

import * as React from "react"
import { TiptapEditor, tiptapToPlainText } from "@/components/ui/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createChatClientOptions, fetchServerSentEvents, useChat } from "@tanstack/ai-react"
import { Sparkles, PanelRightClose, PanelRightOpen, TableIcon, Wand2, MessageSquare, FileText, Send, Loader2, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  workspace?: string // for TanStack AI + share
  value?: unknown
  onChange?: (json: unknown) => void
  placeholder?: string
  heightClass?: string
  shareToken?: string | null
  onShareToggle?: () => void
}

export function TiptapEditorWithAI({ workspace, value, onChange, placeholder, heightClass = "min-h-[320px]", shareToken, onShareToggle }: Props) {
  const [editor, setEditor] = React.useState<any>(null)
  const [collapsed, setCollapsed] = React.useState(false)

  const plainSelection = () => {
    try {
      const { from, to } = editor?.state.selection ?? {}
      const text = editor?.state.doc.textBetween(from, to, " ") ?? ""
      return text.trim().slice(0, 2000)
    } catch { return "" }
  }

  const plainDoc = () => {
    try { return tiptapToPlainText(editor?.getJSON() ?? value).slice(0, 4000) } catch { return "" }
  }

  // TanStack AI chat — streaming, like assistant-panel.tsx:381
  const chatOpts = React.useMemo(() => {
    if (!workspace) return null
    return createChatClientOptions({
      initialMessages: [],
      connection: fetchServerSentEvents(`/api/editor-ai/${workspace}`),
    })
  }, [workspace])

  const tanstack = chatOpts ? (useChat as any)(chatOpts) : null
  const tMessages: any[] = tanstack?.messages ?? []
  const tSend = tanstack?.sendMessage as ((c: string) => void) | undefined
  const tLoading = tanstack?.isLoading ?? false
  const tError = tanstack?.error

  // Fallback local msgs when no workspace / TanStack not ready
  const [localMsgs, setLocalMsgs] = React.useState<Array<{ role: "user" | "assistant"; text: string; tiptap?: unknown }>>([
    { role: "assistant", text: "I’m your doc editor (TanStack AI). Try: “create 3×3 table with headers Task | Owner | Due”, “summarize this”, “rewrite selection to be concise”, or “read doc and list missing links”. Right chat reads the doc — no hardcode." },
  ])
  const [input, setInput] = React.useState("")
  const [localPending, setLocalPending] = React.useState(false)

  const isPending = workspace ? tLoading : localPending
  const displayMsgs = workspace ? tMessages.map((m: any) => {
    const txt = m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.content).join("\n") ?? m.content ?? ""
    return { role: m.role as "user"|"assistant", text: txt }
  }) as Array<{role:"user"|"assistant";text:string}> : localMsgs

  async function send(prompt?: string) {
    const p = (prompt ?? input).trim()
    if (!p) return
    setInput("")

    // Deterministic table fast-path — no LLM needed, instant like Claude skill
    if (p.toLowerCase().includes("table") && editor) {
      const dim = p.match(/(\d+)\s*[x×]\s*(\d+)/)
      const rows = dim ? Math.min(10, Math.max(1, parseInt(dim[1],10))) : 3
      const cols = dim ? Math.min(8, Math.max(1, parseInt(dim[2],10))) : 3
      const tiptap = { type: "table", content: Array.from({ length: rows }).map((_, r) => ({ type: "tableRow", content: Array.from({ length: cols }).map((__, c) => ({ type: r===0 ? "tableHeader" : "tableCell", attrs: { colspan: 1, rowspan: 1, colwidth: null }, content: [{ type: "paragraph", content: r===0 ? [{ type:"text", text: `Header ${c+1}` }] : [] }] })), })) }
      editor.chain().focus().insertContent(tiptap).run()
      if (!workspace) setLocalMsgs((m) => [...m, { role: "user", text: p }, { role: "assistant", text: `Created ${rows}×${cols} table — edit cells directly.` }])
      else tSend?.(`[Editor Context]\nDoc:\n${plainDoc()}\nSelection: ${plainSelection()}\n\nUser: ${p}\n\n(You already inserted the table locally — just acknowledge)`)
      return
    }

    if (workspace && tSend) {
      const doc = plainDoc()
      const sel = plainSelection()
      const withContext = `[Editor Context — read before answering]\nDoc plain (${doc.split(/\s+/).length} words):\n---\n${doc.slice(0,3500)}\n---\nSelection: ${sel || "(none)"}\n\nUser: ${p}`
      // TanStack AI streaming
      tSend(withContext)
      return
    }

    // Local fallback (no workspace)
    setLocalMsgs((m) => [...m, { role: "user", text: p }])
    setLocalPending(true)
    try {
      const editorJson = editor?.getJSON() ?? value
      const selectionText = plainSelection()
      const { aiEditorChatAction } = await import("@/lib/actions/ai-editor")
      const r: any = await aiEditorChatAction(workspace ?? "demo", { prompt: p, editorJson, selectionText })
      const res = r?.ok ? r.data : { text: r?.error ?? "AI error" }
      if (res?.tiptap && res.tiptap.type === "table" && editor) {
        editor.chain().focus().insertContent(res.tiptap).run()
        setLocalMsgs((m) => [...m, { role: "assistant", text: res.text }])
      } else if (res?.text) setLocalMsgs((m) => [...m, { role: "assistant", text: res.text, tiptap: res.tiptap }])
    } catch (e: any) {
      setLocalMsgs((m) => [...m, { role: "assistant", text: e?.message ?? "Failed" }])
    } finally { setLocalPending(false) }
  }

  const applyLast = (text: string) => {
    if (!editor || !text) return
    editor.chain().focus().insertContent(`<p>${text.replace(/\n/g, "<br>")}</p>`).run()
  }

  return (
    <div className={cn("flex rounded-lg border overflow-hidden bg-card", heightClass)}>
      {/* Editor pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-2 py-1.5 border-b bg-muted/20">
          <span className="text-xs font-medium flex items-center gap-1.5"><FileText className="size-3.5 text-primary" /> Doc</span>
          <div className="flex items-center gap-1">
            {workspace && onShareToggle ? (
              <Button variant={shareToken ? "secondary" : "ghost"} size="sm" className="h-7 text-xs gap-1" onClick={onShareToggle} title={shareToken ? "Public link active — click to copy/disable" : "Make doc public"}>
                <Share2 className="size-3" />{shareToken ? "Public" : "Share"}
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setCollapsed((v) => !v)} title={collapsed ? "Open AI chat (TanStack AI)" : "Collapse chat"}>
              {collapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <TiptapEditor value={value} onChange={onChange} onReady={setEditor} placeholder={placeholder ?? "Write, paste Sheet/Doc… Select text then ask AI to rewrite. Ask “create table” etc."} className="border-0 rounded-none min-h-full" />
        </div>
      </div>

      {/* Chat pane — collapsible like Claude docs */}
      <div className={cn("border-l bg-muted/10 flex flex-col transition-all duration-200", collapsed ? "w-0 min-w-0 overflow-hidden border-0" : "w-[340px] min-w-[280px]")}>
        {!collapsed ? (
          <>
            <div className="px-3 py-2 border-b bg-card flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5"><Sparkles className="size-3.5 text-primary" /> Editor Chat</span>
              <span className="text-[0.625rem] text-muted-foreground">read · write · tables</span>
            </div>

            {/* Quick actions (like Claude docs skill) — TanStack AI */}
            <div className="p-2 flex flex-wrap gap-1.5 border-b bg-card/50">
              {[
                { label: "Read doc", prompt: "read doc and summarize key points" , icon: MessageSquare },
                { label: "Rewrite", prompt: "rewrite selection to be concise and clear", icon: Wand2 },
                { label: "Table 3×3", prompt: "create 3x3 table with headers", icon: TableIcon },
                { label: "Summarize", prompt: "summarize this doc", icon: Sparkles },
              ].map((a) => {
                const Icon = a.icon as any
                return <Button key={a.label} variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => send(a.prompt)} disabled={isPending}><Icon className="size-3" />{a.label}</Button>
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {displayMsgs.map((m, i) => (
                <div key={i} className={cn("rounded-lg p-2.5 text-xs leading-relaxed whitespace-pre-wrap", m.role === "user" ? "bg-primary text-primary-foreground ml-6" : "bg-card border mr-2")}>
                  <div className="font-medium text-[0.625rem] opacity-70 mb-1">{m.role === "user" ? "You" : "AI"}</div>
                  <div>{m.text}</div>
                  {m.role === "assistant" && m.text ? (
                    <Button variant="ghost" size="sm" className="h-6 mt-2 text-xs gap-1" onClick={() => applyLast(m.text)}><Send className="size-3" /> Insert into doc</Button>
                  ) : null}
                </div>
              ))}
              {isPending ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Thinking…</div> : null}
              {tError ? <div className="text-xs text-destructive">AI error: {String((tError as any)?.message ?? tError)}</div> : null}
            </div>

            <div className="p-2 border-t bg-card flex items-center gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }} placeholder='Tell AI: “create table”, “rewrite selection”, “read and fix”' className="h-8 text-xs flex-1" disabled={isPending} />
              <Button size="sm" className="h-8 text-xs gap-1" onClick={() => send()} disabled={isPending || !input.trim()}><Send className="size-3" />Send</Button>
            </div>
            <p className="px-3 pb-2 text-[0.625rem] text-muted-foreground">Select text in doc first, then “Rewrite”. AI reads full doc JSON (no hardcode).</p>
          </>
        ) : null}
      </div>
    </div>
  )
}
