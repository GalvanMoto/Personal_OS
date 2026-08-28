"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Sparkles, Trash2, Globe, Lock, Download, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { ShareButton } from "@/components/share/share-button"
import { updateDocumentAction } from "@/lib/actions/entities"

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

  function handleSave() {
    setErrorMsg(null)
    startSave(async () => {
      const fd = new FormData()
      fd.append("id", initialDoc.id)
      fd.append("title", title)
      fd.append("summary", summary)
      
      const contentStr = typeof content === "object" ? JSON.stringify(content) : String(content || "")
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
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-6xl mx-auto w-full">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/w/${workspace}/documents`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Documents Matrix</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {initialDoc.file ? "File Backed" : "Live Document"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
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
            className="h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
          >
            {saveSuccess ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>{saving ? "Saving..." : "Save Document"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div className="p-3 text-xs rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
          {errorMsg}
        </div>
      ) : null}

      {/* Main Editing Canvas */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Document Title */}
          <div className="space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
              className="text-xl md:text-2xl font-bold tracking-tight border-none bg-transparent px-0 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/50 h-auto py-1"
            />
            <p className="text-[11px] text-muted-foreground font-mono">
              Last saved {new Date(initialDoc.updatedAt).toLocaleString("en-IN")} · {typeof content === "string" ? content.length : JSON.stringify(content).length} characters
            </p>
          </div>

          {/* Tiptap Rich Content Editor */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Document Body &amp; Specifications
            </span>
            <TiptapEditor
              value={content}
              onChange={(val) => setContent(val)}
              placeholder="Author requirements, client deliverables, contracts, or paste brief details..."
              className="min-h-[420px] bg-card border-border/80 shadow-xs"
            />
          </div>
        </div>

        {/* Sidebar Info & AI Summary */}
        <div className="space-y-4">
          {/* AI Semantic Summary */}
          <Card className="border-border/80 bg-card/60 backdrop-blur-xs">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI Summary &amp; Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-level summary extracted from the brief or authored for AI context packs..."
                rows={5}
                className="text-xs resize-none bg-muted/30 font-sans"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This summary is indexed by the Personal OS AI Agent to understand deliverables and client constraints.
              </p>
            </CardContent>
          </Card>

          {/* Source File Info if present */}
          {initialDoc.file ? (
            <Card className="border-border/80">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold">Attached File</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <div className="p-2.5 rounded-md border bg-muted/20 space-y-1">
                  <p className="font-medium text-foreground truncate">{initialDoc.file.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {(initialDoc.file.sizeBytes / 1024).toFixed(1)} KB · {initialDoc.file.mimeType}
                  </p>
                </div>
                <a
                  href={`/api/files/${workspace}/${initialDoc.file.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs font-medium hover:bg-muted transition-colors text-primary"
                >
                  <Download className="size-3.5" />
                  <span>Download Original</span>
                </a>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
