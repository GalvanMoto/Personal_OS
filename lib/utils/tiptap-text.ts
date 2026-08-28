/**
 * Isomorphic utility to extract clean plain text from Tiptap AST JSON or raw text.
 * Can be called safely from both Server Components and Client Components.
 */
export function tiptapToPlainText(json: unknown): string {
  if (!json) return ""
  try {
    const j: any = typeof json === "string" ? JSON.parse(json as string) : json
    const walk = (n: any): string => {
      if (!n) return ""
      if (n.type === "text") return n.text ?? ""
      if (Array.isArray(n.content)) {
        return n.content
          .map(walk)
          .filter(Boolean)
          .join(n.type === "paragraph" ? "\n\n" : " ")
      }
      return ""
    }
    const result = walk(j).trim()
    if (result) return result.slice(0, 4000)
    return typeof json === "string" ? (json as string).slice(0, 4000) : ""
  } catch {
    return typeof json === "string" ? (json as string).slice(0, 4000) : ""
  }
}
