"use client"

import { useRef, useState, useTransition } from "react"
import { PaperclipIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { captureAction } from "@/lib/actions/inbox"
import { uploadToInboxAction } from "@/lib/actions/files"

/**
 * The universal inbox capture box (PRD §24).
 *
 * Text and files land in the same place. Nothing is written into the graph
 * here — capture produces a reviewable proposal, which is what separates this
 * from a task form.
 */
export function CaptureBox({ workspace }: { workspace: string }) {
  const [text, setText] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function submitText() {
    const value = text.trim()
    if (!value) return

    startTransition(async () => {
      const data = new FormData()
      data.set("text", value)

      const result = await captureAction(workspace, data)

      if (result.ok) {
        setText("")
        setError(null)
        setMessage("Captured — review it below.")
      } else {
        setMessage(null)
        setError(result.error)
      }
    })
  }

  function submitFile(file: File) {
    startTransition(async () => {
      const data = new FormData()
      data.set("file", file)

      const result = await uploadToInboxAction(workspace, data)

      if (result.ok) {
        setError(null)
        setMessage(
          result.data.extracted
            ? "Read it — review below."
            : "Stored. I couldn't read that format."
        )
      } else {
        setMessage(null)
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-4">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault()
              submitText()
            }
          }}
          rows={3}
          placeholder="Paste a client message, a brief, a link — anything."
          className="resize-none text-xs"
        />

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) submitFile(file)
              event.target.value = ""
            }}
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            <PaperclipIcon />
            Upload
          </Button>

          <Button size="sm" onClick={submitText} disabled={pending || !text.trim()}>
            {pending ? <Spinner /> : <SendIcon />}
            Capture
          </Button>

          <span className="ml-auto text-[0.625rem] text-muted-foreground">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              (message ?? "⌘↵ to capture")
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
