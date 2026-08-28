"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getCurrentSession, requireUser } from "@/lib/auth/dal"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { createSession, destroySession, setActiveTenant } from "@/lib/auth/session"
import { prisma } from "@/lib/db/client"
import { uniqueSlug } from "@/lib/slug"

export type FormState = { error?: string; fieldErrors?: Record<string, string> }

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  workspace: z.string().trim().min(1, "Name your workspace").max(60),
})

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})

function fieldErrors(error: z.ZodError): FormState {
  const flat: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    flat[key] ??= issue.message
  }
  return { fieldErrors: flat }
}

export async function signUp(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  return { error: "Registration is disabled on this private instance." }
}

export async function signIn(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  // Same message and comparable timing whether the address is unknown or the
  // password is wrong, so the form cannot be used to enumerate accounts.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "scrypt$16384$8$1$00$00")

  if (!user || !ok) {
    return { error: "That email and password do not match." }
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { tenant: true },
  })

  await createSession(user.id, membership?.tenantId)
  redirect(membership ? `/w/${membership.tenant.slug}/today` : "/workspaces/new")
}

export async function signOut() {
  await destroySession()
  redirect("/login")
}

const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Name your workspace").max(60),
})

export async function createWorkspace(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser()
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return fieldErrors(parsed.error)

  const slug = await uniqueSlug(parsed.data.name, async (candidate) =>
    Boolean(await prisma.tenant.findUnique({ where: { slug: candidate } }))
  )

  const tenant = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: { name: parsed.data.name, slug },
    })
    await tx.membership.create({
      data: { userId: user.id, tenantId: tenant.id, role: "OWNER" },
    })
    return tenant
  })

  const session = await getCurrentSession()
  if (session) await setActiveTenant(session.id, tenant.id)

  redirect(`/w/${tenant.slug}/today`)
}
