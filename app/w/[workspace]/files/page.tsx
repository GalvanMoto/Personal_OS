import { requireWorkspace } from "@/lib/auth/dal"
import Link from "next/link"
import {
  Building2,
  Cloud,
  Download,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  FolderGit2,
  HardDrive,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react"

import { CreateFileDrawer } from "@/components/create/create-file-drawer"
import { UniversalFilterBar } from "@/components/filters/universal-filter-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Digital Assets & Knowledge Files · Personal OS" }

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export default async function FilesPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const [files, documents, links] = await Promise.all([
    db.fileObject.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.document.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.linkResource.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ])

  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0)
  const totalAssets = files.length + documents.length + links.length

  const brandAssets = files.filter(
    (f) =>
      f.mimeType.startsWith("image/") ||
      f.name.toLowerCase().includes("logo") ||
      f.name.toLowerCase().includes("brand") ||
      f.name.toLowerCase().includes("figma")
  )

  const docAssets = files.filter(
    (f) =>
      f.mimeType.includes("pdf") ||
      f.mimeType.includes("document") ||
      f.name.toLowerCase().includes("contract") ||
      f.name.toLowerCase().includes("brief")
  )

  const tiles = [
    {
      label: "Indexed Knowledge Assets",
      value: totalAssets,
      unit: "items",
      note: "files, briefs, links & docs",
      icon: HardDrive,
    },
    {
      label: "Object Storage Used",
      value: formatBytes(totalBytes),
      unit: "deduped",
      note: "SHA-256 content addressing",
      icon: Cloud,
    },
    {
      label: "Google Drive Sync",
      value: "Personal_OS",
      unit: "hierarchy",
      note: `📁 /${workspace}/ briefs, finance, media`,
      icon: FolderGit2,
    },
    {
      label: "Access Policy",
      value: "Workspace-Scoped",
      unit: "enforced",
      note: "cryptographic token auth",
      icon: Shield,
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Digital Assets &amp; Knowledge Files</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Centralized file vault: Google Drive hierarchical folder syncing, SHA-256 deduplication, and AI knowledge indexing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Cloud className="size-3 text-emerald-500" />
            Google Drive Active
          </Badge>
          <CreateFileDrawer workspace={workspace} />
        </div>
      </div>

      {/* 4 Stat Tiles */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <Card key={tile.label} className="p-0">
              <CardContent className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{tile.label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tabular-nums">{tile.value}</span>
                    <span className="text-xs text-muted-foreground">{tile.unit}</span>
                  </p>
                  <p className="truncate text-[0.625rem] text-muted-foreground">{tile.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Universal Date Engine & Filter Bar */}
      <UniversalFilterBar searchPlaceholder="Search files, logos, PDF statements, and drive links..." />

      {/* Main Tabbed Asset Matrix */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-8 text-[0.6875rem]">
          <TabsTrigger value="all">All Assets ({files.length})</TabsTrigger>
          <TabsTrigger value="brand">Brand &amp; Media ({brandAssets.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents &amp; PDFs ({docAssets.length})</TabsTrigger>
          <TabsTrigger value="drive">Drive Links ({links.length})</TabsTrigger>
        </TabsList>

        {/* 1. ALL ASSETS */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Stored Digital Objects</span>
                <Badge variant="outline">{files.length} Files</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {files.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Files Stored</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload documents or vector assets using the Upload File button above.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {files.map((file) => {
                    const isGdrive = file.storageKey.startsWith("gdrive://")
                    const gdriveId = isGdrive ? file.storageKey.replace("gdrive://", "").split(":")[0] : null

                    return (
                      <div key={file.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary">
                            {file.mimeType.startsWith("image/") ? (
                              <ImageIcon className="size-4" />
                            ) : file.mimeType.includes("pdf") ? (
                              <FileText className="size-4" />
                            ) : (
                              <FileCode className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-[0.625rem] text-muted-foreground font-mono">
                              {formatBytes(file.sizeBytes)} · {file.mimeType} · {file.createdAt.toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isGdrive && gdriveId ? (
                            <a
                              href={`https://drive.google.com/file/d/${gdriveId}/view`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[0.6875rem] text-emerald-500 hover:underline font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                            >
                              <ExternalLink className="size-3" />
                              <span>Google Drive</span>
                            </a>
                          ) : (
                            <Badge variant="outline" className="text-[0.625rem] font-mono">
                              {file.sourceType}
                            </Badge>
                          )}
                          <a
                            href={`/api/files/${file.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                          >
                            <Download className="size-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. BRAND & MEDIA */}
        <TabsContent value="brand" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Brand Vector Logos &amp; Media Assets</span>
                <Badge variant="outline">{brandAssets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {brandAssets.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Brand Assets Recorded</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload SVG logos, design banners, or PNG assets.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
                  {brandAssets.map((asset) => (
                    <div key={asset.id} className="p-3 rounded-lg border bg-muted/10 space-y-2 hover:border-primary/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate text-xs">{asset.name}</span>
                        <ImageIcon className="size-3.5 text-primary shrink-0" />
                      </div>
                      <p className="text-[0.625rem] text-muted-foreground font-mono">{formatBytes(asset.sizeBytes)}</p>
                      <a
                        href={`/api/files/${asset.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      >
                        <Download className="size-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Briefs, Contracts &amp; PDF Invoices</span>
                <Badge variant="outline">{docAssets.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {docAssets.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Document Assets Recorded</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Upload client briefs or agreements to index them.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {docAssets.map((doc) => (
                    <div key={doc.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="size-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[0.625rem] text-muted-foreground font-mono">
                            {formatBytes(doc.sizeBytes)} · {doc.createdAt.toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`/api/files/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      >
                        <Download className="size-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. DRIVE LINKS */}
        <TabsContent value="drive" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>External Google Drive &amp; Cloud Links</span>
                <Badge variant="outline">{links.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {links.length === 0 ? (
                <Empty className="py-12">
                  <EmptyTitle className="text-sm">No Drive Links Indexed</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    Sync your Google Drive folder or paste external links.
                  </EmptyDescription>
                </Empty>
              ) : (
                <div className="divide-y text-xs">
                  {links.map((link) => (
                    <div key={link.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <LinkIcon className="size-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{link.title || link.url}</p>
                          <p className="text-[0.625rem] text-muted-foreground font-mono truncate">{link.url}</p>
                        </div>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      >
                        <ExternalLink className="size-3" />
                        <span>Open</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
