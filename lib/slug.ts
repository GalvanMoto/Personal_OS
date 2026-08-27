const SLUG_SAFE = /[^a-z0-9]+/g

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(SLUG_SAFE, "-")
    .replace(/^-+|-+$/g, "")

  return base || "workspace"
}

/**
 * Finds a free slug by appending -2, -3, … until `isTaken` says otherwise.
 * Callers pass a lookup rather than a table so this stays usable for tenants,
 * projects and organizations alike.
 */
export async function uniqueSlug(
  desired: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(desired)

  if (!(await isTaken(base))) return base

  for (let suffix = 2; suffix < 500; suffix++) {
    const candidate = `${base}-${suffix}`
    if (!(await isTaken(candidate))) return candidate
  }

  return `${base}-${Date.now()}`
}
