import "server-only"

import { z } from "zod"

import { AuthorizationError, requireWorkspace } from "@/lib/auth/dal"
import type { DomainContext } from "@/lib/domain/context-types"

/**
 * Shared shape for every server action.
 *
 * Actions return a result rather than throwing, so a form can render the
 * failure next to the field that caused it. Genuine faults still throw and
 * reach the error boundary — this is for the failures a user can fix.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export function ok(): ActionResult
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data }
}

export function fail(error: string, fieldErrors?: Record<string, string>) {
  return { ok: false as const, error, fieldErrors }
}

export function fromZodError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    fieldErrors[key] ??= issue.message
  }

  return { ok: false, error: "Please check the highlighted fields.", fieldErrors }
}

/**
 * Resolves a workspace and returns everything an action needs.
 *
 * Every action starts here, so authentication and tenant scoping are not
 * something an individual action can forget: without this call there is no
 * database handle to write through.
 */
export async function workspaceContext(slug: string) {
  const { db, tenant, user, role } = await requireWorkspace(slug)

  const ctx: DomainContext = {
    tenantId: tenant.id,
    userId: user.id,
    actorType: "USER",
  }

  return { db, tenant, user, role, ctx }
}

/**
 * Wraps an action body so expected failures become results.
 *
 * Redirects and Next's control-flow errors are re-thrown untouched — swallowing
 * them would turn a redirect into a silent no-op.
 */
export async function guard<T>(
  run: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await run()
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw error
    }

    if (error instanceof AuthorizationError) {
      return { ok: false, error: error.message }
    }

    console.error("[action]", error)

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    }
  }
}
