"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, Bold, Italic, List, ListOrdered, Quote, Undo2, Redo2, TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  value?: unknown // JSONContent or null
  onChange?: (json: unknown) => void
  onReady?: (editor: any) => void
  editable?: boolean
  placeholder?: string
  className?: string
}

function toContent(v: unknown) {
  if (!v) return null
  if (typeof v === "string") {
    try { return JSON.parse(v) } catch { return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: v }] }] } }
  }
  return v as any
}

export function TiptapEditor({ value, onChange, onReady, editable = true, placeholder = "Add details, links, notes… (supports links & lists)", className }: Props) {
  const [linkOpen, setLinkOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1,2,3] }, codeBlock: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { class: "text-primary underline underline-offset-4" } }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: toContent(value) ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  })

  React.useEffect(() => {
    if (!editor || !editable) return
    // sync when value prop changes externally (e.g. open edit)
    const cur = editor.getJSON()
    const incoming = toContent(value)
    if (incoming && JSON.stringify(cur) !== JSON.stringify(incoming)) {
      editor.commands.setContent(incoming as any)
    }
  }, [value, editor, editable])

  React.useEffect(() => { editor?.setEditable(editable) }, [editable, editor])
  React.useEffect(() => { if (editor && onReady) onReady(editor) }, [editor, onReady])

  if (!editor) return <div className="min-h-[96px] rounded border bg-muted/20 animate-pulse" />

  const can = editable

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden flex flex-col", className)}>
      {can ? (
        <div className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-muted/30">
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().toggleBold().run()} data-active={editor.isActive("bold")}>
            <Bold className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="size-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setLinkOpen((v) => !v)}>
            <Link2 className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            <TableIcon className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="size-3.5" />
          </Button>
        </div>
      ) : null}
      {can && linkOpen ? (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://docs.google.com/… or https://…" className="h-7 text-xs flex-1" />
          <Button size="sm" className="h-7 text-xs" onClick={() => { if (linkUrl.trim()) { editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run(); setLinkUrl(""); setLinkOpen(false) } }}>Add link</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false) }}>Unlink</Button>
        </div>
      ) : null}
      <EditorContent editor={editor} className={cn("prose prose-sm max-w-none p-3 min-h-[96px] text-sm leading-relaxed prose-a:text-primary prose-p:my-1 prose-ul:my-1 prose-table:w-full prose-table:border-collapse focus:outline-none [&_.tiptap]:outline-none [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:bg-muted/40 [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_table]:my-2", !editable && "prose-p:my-2")} />
    </div>
  )
}

export function tiptapToPlainText(json: unknown): string {
  try {
    const j: any = typeof json === "string" ? JSON.parse(json as string) : json
    const walk = (n: any): string => {
      if (!n) return ""
      if (n.type === "text") return n.text ?? ""
      if (Array.isArray(n.content)) return n.content.map(walk).join(n.type === "paragraph" ? "\n\n" : " ")
      return ""
    }
    return walk(j).trim().slice(0, 4000)
  } catch { return typeof json === "string" ? (json as string).slice(0,4000) : "" }
}
