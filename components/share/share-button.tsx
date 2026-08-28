"use client"

import * as React from "react"
import { Share2, Copy, Check, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toggleTaskShareAction, toggleDocumentShareAction } from "@/lib/actions/share"

type Props = { workspace: string; taskId?: string; documentId?: string; initialToken?: string | null; initialPublic?: boolean }

export function ShareButton({ workspace, taskId, documentId, initialToken, initialPublic }: Props) {
  const [token, setToken] = React.useState(initialToken ?? null)
  const [isPublic, setIsPublic] = React.useState(Boolean(initialPublic))
  const [pending, start] = React.useTransition()
  const [copied, setCopied] = React.useState(false)

  const url = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}` : null

  function toggle() {
    start(async () => {
      const res: any = taskId ? await toggleTaskShareAction(workspace, taskId) : await toggleDocumentShareAction(workspace, documentId!)
      if (res?.ok) {
        setToken(res.data.shareToken)
        setIsPublic(res.data.isPublic)
        if (res.data.url && typeof window !== "undefined") {
          const full = `${window.location.origin}${res.data.url}`
          await navigator.clipboard.writeText(full).catch(()=>{})
          setCopied(true); setTimeout(()=>setCopied(false), 1500)
        }
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant={isPublic ? "secondary" : "outline"} size="sm" className="h-7 text-xs gap-1" onClick={toggle} disabled={pending}>
        {isPublic ? <Globe className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
        {isPublic ? "Public" : "Share"}
      </Button>
      {isPublic && url ? (
        <>
          <a href={url} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary underline truncate max-w-[180px]">{url.replace(/^https?:\/\//,"")}</a>
          <Button variant="ghost" size="icon" className="size-7" onClick={async()=>{ if(url){ await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),1500)}}}>
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </Button>
        </>
      ) : null}
      <Badge variant="outline" className="text-[0.625rem] gap-1">{isPublic ? <Globe className="size-3 text-emerald-500" /> : <Lock className="size-3" />}{isPublic ? "Anyone with link can view" : "Private"}</Badge>
    </div>
  )
}
