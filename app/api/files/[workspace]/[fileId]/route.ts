import { requireWorkspace } from "@/lib/auth/dal"
import { readStoredFile } from "@/lib/domain/files"

/**
 * Serves a stored file.
 *
 * Membership is proven before a single byte is read, and the object key is
 * re-checked against the tenant inside `readStoredFile`. Files are never served
 * from a public path — there is no unauthenticated route to storage at all.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspace: string; fileId: string }> }
) {
  const { workspace, fileId } = await params
  const { db, tenant } = await requireWorkspace(workspace)

  const found = await readStoredFile(db, tenant.id, fileId)

  if (!found) {
    return new Response("Not found", { status: 404 })
  }

  const { file, bytes } = found

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.sizeBytes),
      // `inline` lets images and PDFs preview; the quoted filename keeps a
      // comma or quote in the name from splitting the header.
      "Content-Disposition": `inline; filename="${file.name.replace(/["\\]/g, "")}"`,
      // Private: this URL is only meaningful to an authenticated member, so no
      // shared cache should ever hold it.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
