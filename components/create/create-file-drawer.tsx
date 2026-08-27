"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  Cloud,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  HardDrive,
  Image as ImageIcon,
  LinkIcon,
  Loader2,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { uploadToInboxAction } from "@/lib/actions/files"

interface CreateFileDrawerProps {
  workspace: string
  trigger?: React.ReactNode
  defaultProjectId?: string
}

export function CreateFileDrawer({
  workspace,
  trigger,
  defaultProjectId,
}: CreateFileDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [activeSection, setActiveSection] = React.useState("upload")
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Please choose a file to upload.")
      return
    }

    setPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("file", selectedFile)

    const res = await uploadToInboxAction(workspace, formData)
    setPending(false)
    if (!res.ok) {
      setError(res.error || "Failed to upload file")
    } else {
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedFile(null)
        router.refresh()
      }, 600)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger render={<span className="inline-flex cursor-pointer" />} nativeButton={false}>
          {trigger}
        </SheetTrigger>
      ) : (
        <SheetTrigger
          render={
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground font-medium" />
          }
        >
          <Upload className="size-3.5" />
          <span>Upload File</span>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-[420px] sm:w-[560px] p-0 flex flex-col h-full bg-background border-l">
        {/* Top Header */}
        <div className="px-6 py-5 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <HardDrive className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                Upload Asset &amp; Document
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Central digital asset layer: SHA-256 deduplicated, OCR indexed, and graph linked.
              </SheetDescription>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>File uploaded and indexed into knowledge vault!</span>
          </div>
        ) : null}

        {/* Main Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-9 p-1 bg-muted/50 rounded-lg text-xs">
                <TabsTrigger value="upload" className="gap-1.5 py-1 text-xs">
                  <Upload className="size-3.5" />
                  <span>File &amp; Meta</span>
                </TabsTrigger>
                <TabsTrigger value="relations" className="gap-1.5 py-1 text-xs">
                  <FolderGit2 className="size-3.5" />
                  <span>Context</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5 py-1 text-xs">
                  <Shield className="size-3.5" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>

              {/* 1. UPLOAD TAB */}
              <TabsContent value="upload" className="mt-4 space-y-4 text-xs">
                {/* File Dropzone Area */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground flex items-center gap-1">
                    Select File <span className="text-destructive">*</span>
                  </label>
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 p-6 text-center hover:border-primary/50 transition-colors">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="size-6 text-primary shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-xs text-foreground truncate max-w-[200px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-[0.625rem] text-muted-foreground font-mono">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · {selectedFile.type || "binary"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setSelectedFile(null)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto size-6 text-muted-foreground/60" />
                        <p className="text-xs font-medium text-foreground">
                          Click to select a file or drag and drop
                        </p>
                        <p className="text-[0.625rem] text-muted-foreground">
                          PDF, PNG, JPG, MP4, XLSX, DOCX (Max 25 MB)
                        </p>
                        <input
                          type="file"
                          required
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Asset Category</label>
                    <select
                      name="category"
                      defaultValue="CLIENT_DOC"
                      className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="CLIENT_DOC">📄 Briefs &amp; Contracts</option>
                      <option value="FINANCIAL">💳 Finance &amp; Invoices</option>
                      <option value="BRAND_ASSET">🎨 Brand Assets &amp; Logos</option>
                      <option value="MEDIA">🎬 Deliverables &amp; Footage</option>
                      <option value="GENERAL">📥 General Captures</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">Custom Display Title</label>
                    <Input
                      name="title"
                      placeholder="Optional friendly name"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Google Drive Hierarchy Target Banner */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 font-mono">
                  <Cloud className="size-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[0.6875rem] leading-none">Google Drive Storage Tree Active</p>
                    <p className="text-[0.625rem] text-emerald-500/80 truncate mt-0.5">
                      📁 My Drive &gt; Personal_OS &gt; {workspace} &gt; [Category]
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Description &amp; Notes</label>
                  <Textarea
                    name="description"
                    rows={3}
                    placeholder="Provide notes on what this asset is and when it should be referenced..."
                    className="text-xs resize-none"
                  />
                </div>
              </TabsContent>

              {/* 2. RELATIONS TAB */}
              <TabsContent value="relations" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Project Association</label>
                  <Input
                    name="projectId"
                    defaultValue={defaultProjectId || ""}
                    placeholder="Link to Project ID"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Client / Organization</label>
                  <Input
                    name="clientName"
                    placeholder="e.g. GB Banquet &amp; Hospitality"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Tags</label>
                  <Input
                    name="tags"
                    placeholder="e.g. logo, dark-mode, high-res, 2026"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </TabsContent>

              {/* 3. SECURITY TAB */}
              <TabsContent value="security" className="mt-4 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Sensitivity Classification</label>
                  <select
                    name="sensitivity"
                    defaultValue="INTERNAL"
                    className="w-full h-9 rounded-md border bg-background px-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="PUBLIC">Public (Sharable with clients/vendors)</option>
                    <option value="INTERNAL">Internal (Team / Studio accessible)</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="SENSITIVE">Sensitive (Restricted tool scope)</option>
                    <option value="HIGHLY_SENSITIVE">Highly Sensitive (Financial / Passwords)</option>
                  </select>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[0.6875rem] text-muted-foreground flex items-center gap-2">
                  <Lock className="size-4 shrink-0 text-primary" />
                  <span>
                    Sensitive and Highly Sensitive files are restricted to Finance &amp; System Agents with user approval.
                  </span>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Bottom Footer */}
          <div className="mt-auto border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[0.625rem] text-muted-foreground font-mono">
              Press Enter to upload
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || !selectedFile}
                size="sm"
                className="text-xs h-8 px-4 font-medium shadow-xs"
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <>
                    <Upload className="size-3.5 mr-1" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
