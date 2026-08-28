"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Sparkles, Download, Check, FileText, PanelRightClose, PanelRightOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TiptapEditorWithAI } from "@/components/ui/tiptap-editor-with-ai"
import { ShareButton } from "@/components/share/share-button"
import { updateDocumentAction } from "@/lib/actions/entities"
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

export function DocumentEditor({
  workspace,
  initialDoc,
}: {
  workspace: string
  initialDoc: DocData
}) {
  const router = useRouter()
  const [title, setTitle] = React.useState(initialDoc.title)
  const [summary, setSummary] = React.useState(initialDoc.summary || "")
  const [content, setContent] = React.useState<any>(initialDoc.content || "")
  const [saving, startSave] = React.useTransition()
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

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
            className="h-8 px-3.5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            className="size-8 text-muted-foreground hover:text-foreground hidden md:inline-flex"
            title={sidebarOpen ? "Hide AI Context & File Info" : "Show AI Context & File Info"}
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

      {/* 2. MAIN WORKSPACE: CANVAS + OPTIONAL SIDEBAR */}
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

          {/* Tiptap Editor Canvas with AI Assistant sidebar */}
          <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <TiptapEditorWithAI
              workspace={workspace}
              value={content}
              onChange={(val) => setContent(val)}
              placeholder="Start authoring requirements, specifications, deliverables or paste client brief details…"
              heightClass="min-h-[500px]"
              shareToken={initialDoc.shareToken}
            />
          </div>
        </main>

        {/* 3. SIDEBAR: AI Context, Key Summary & Source File Info */}
        {sidebarOpen ? (
          <aside className="w-80 shrink-0 border-l bg-muted/10 p-4 space-y-4 overflow-y-auto hidden md:flex md:flex-col">
            {/* AI Semantic Summary */}
            <Card className="border-border/80 bg-card/70 backdrop-blur-xs shadow-none">
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
                  className="text-xs resize-none bg-muted/40 font-sans leading-relaxed"
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Used by Personal OS agents to answer questions and detect deliverable dependencies.
                </p>
              </CardContent>
            </Card>

            {/* Attached File Object */}
            {initialDoc.file ? (
              <Card className="border-border/80 bg-card/70 shadow-none">
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
                    className="w-full inline-flex items-center justify-center gap-1.5 h-7.5 rounded-md border bg-card text-xs font-medium hover:bg-muted transition-colors text-primary"
                  >
                    <Download className="size-3.5" />
                    <span>Download Original</span>
                  </a>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  )
}
