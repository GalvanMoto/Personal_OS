"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Link2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  TableIcon,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  value?: unknown // JSONContent or null
  onChange?: (json: unknown) => void
  onReady?: (editor: any) => void
  editable?: boolean
  placeholder?: string
  className?: string
  editorClassName?: string
}

function toContent(v: unknown) {
  if (!v) return null
  if (typeof v === "string") {
    try {
      return JSON.parse(v)
    } catch {
      return {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: v }] }],
      }
    }
  }
  return v as any
}

export function TiptapEditor({
  value,
  onChange,
  onReady,
  editable = true,
  placeholder = "Add details, links, notes… (supports links, headings & tables)",
  className,
  editorClassName,
}: Props) {
  const [linkOpen, setLinkOpen] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { class: "text-primary underline underline-offset-4 break-all" },
      }),
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
    const cur = editor.getJSON()
    const incoming = toContent(value)
    if (incoming && JSON.stringify(cur) !== JSON.stringify(incoming)) {
      editor.commands.setContent(incoming as any)
    }
  }, [value, editor, editable])

  React.useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  React.useEffect(() => {
    if (editor && onReady) onReady(editor)
  }, [editor, onReady])

  if (!editor) return <div className="min-h-[140px] rounded-lg border bg-muted/20 animate-pulse" />

  const can = editable

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden flex flex-col w-full relative",
        className
      )}
    >
      {can ? (
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-1 p-2 border-b bg-card/95 backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            data-active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            data-active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            data-active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            data-active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setLinkOpen((v) => !v)}
            data-active={linkOpen || editor.isActive("link")}
            title="Insert Link"
          >
            <Link2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            title="Insert Table"
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <TableIcon className="size-3.5" />
          </Button>

          <div className="mx-1 h-3.5 w-px bg-border/60" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </div>
      ) : null}

      {can && linkOpen ? (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/40">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://docs.google.com/… or https://…"
            className="h-7 text-xs flex-1"
          />
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              if (linkUrl.trim()) {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: linkUrl.trim() })
                  .run()
                setLinkUrl("")
                setLinkOpen(false)
              }
            }}
          >
            Add link
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              editor.chain().focus().unsetLink().run()
              setLinkOpen(false)
            }}
          >
            Unlink
          </Button>
        </div>
      ) : null}

      {/* Editor Content Area with proper scrollable overflow and text wrap */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full", editorClassName)}>
        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none p-4 md:p-6 text-sm leading-relaxed",
            "break-words whitespace-pre-wrap outline-none",
            "prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline",
            "prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:font-bold prose-headings:tracking-tight",
            "prose-blockquote:border-l-2 prose-blockquote:border-primary/60 prose-blockquote:pl-3 prose-blockquote:italic",
            "[&_.tiptap]:outline-none [&_.tiptap]:min-h-full",
            "[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-muted-foreground/60 [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs",
            "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border [&_td]:border-border [&_td]:p-2.5",
            !editable && "prose-p:my-2"
          )}
        />
      </div>
    </div>
  )
}

export { tiptapToPlainText } from "@/lib/utils/tiptap-text"
