import { notFound } from "next/navigation"
import { requireWorkspace } from "@/lib/auth/dal"
import { DocumentEditor } from "@/components/documents/document-editor"

export const metadata = {
  title: "Document Editor · Personal OS",
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>
}) {
  const { workspace, id } = await params
  const { db } = await requireWorkspace(workspace)

  const doc = await db.document.findUnique({
    where: { id },
    include: { file: true },
  })

  if (!doc) notFound()

  return (
    <DocumentEditor
      workspace={workspace}
      initialDoc={{
        id: doc.id,
        title: doc.title,
        content: doc.content,
        summary: doc.summary,
        file: doc.file
          ? {
              id: doc.file.id,
              name: doc.file.name,
              sizeBytes: doc.file.sizeBytes,
              mimeType: doc.file.mimeType,
            }
          : null,
        shareToken: (doc as any).shareToken ?? null,
        isPublic: Boolean((doc as any).isPublic),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      }}
    />
  )
}
