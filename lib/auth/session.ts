import "server-only"

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import { prisma } from "@/lib/db/client"

export const SESSION_COOKIE = "dlrs_session"
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/// The cookie holds the raw token; the database holds only an HMAC digest,
/// so a leaked database dump cannot be replayed as a login.
function digest(token: string): string {
  const secret = process.env.SESSION_SECRET

  if (!secret) {
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env.")
  }

  return createHmac("sha256", secret).update(token).digest("hex")
}

function hmac(value: string): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set.")
  return createHmac("sha256", secret).update(value).digest("base64url")
}

export function signState(value: string): string {
  return `${value}.${hmac(value)}`
}

export function verifyState(signed: string): string | null {
  const dot = signed.lastIndexOf(".")
  if (dot === -1) return null
  const value = signed.slice(0, dot)
  const sig = signed.slice(dot + 1)
  const expected = hmac(value)
  // constant-time compare
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  return timingSafeEqual(a, b) ? value : null
}

export async function createSession(userId: string, activeTenantId?: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await prisma.session.create({
    data: { tokenHash: digest(token), userId, activeTenantId, expiresAt },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })
}

export async function readSession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    include: {
      user: {
        select: { id: true, email: true, name: true, avatarUrl: true, timezone: true },
      },
    },
  })

  if (!session) return null

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }

  return session
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: digest(token) } })
      .catch(() => {})
  }

  store.delete(SESSION_COOKIE)
}

/// Remembers which workspace to land on after the next sign-in.
export async function setActiveTenant(sessionId: string, tenantId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { userId: true } })
  if (!session) throw new Error("Session not found")
  const membership = await prisma.membership.findFirst({ where: { userId: session.userId, tenantId } })
  if (!membership) throw new Error("Cannot activate a workspace you are not a member of")
  await prisma.session.update({
    where: { id: sessionId },
    data: { activeTenantId: tenantId },
  })
}
