"use client"

import { createContext, useContext } from "react"

/**
 * Real workspace data for the dashboard chrome.
 *
 * The vendored sidebar and topbar originally imported their user and navigation
 * straight from the template's `data.tsx`, which is why they showed a clinic's
 * demo content. A context lets them keep their design while the values come
 * from the database — and everything here is serializable, so it crosses the
 * server/client boundary without needing the components to become server ones.
 */

export type ShellWorkspace = {
  slug: string
  name: string
}

export type ShellUser = {
  name: string
  email: string
  avatarUrl: string | null
  role: string
}

export type ShellNotification = {
  id: string
  title: string
  body: string | null
  level: string
  href: string | null
  createdAt: string
  read: boolean
}

export type ShellData = {
  workspace: ShellWorkspace
  /// Every workspace the signed-in user can open, for the switcher.
  workspaces: ShellWorkspace[]
  user: ShellUser
  notifications: ShellNotification[]
  unreadCount: number
  /// Counts rendered as sidebar badges, keyed by nav item href suffix.
  badges: Record<string, number>
}

const ShellContext = createContext<ShellData | null>(null)

export function ShellProvider({
  value,
  children,
}: {
  value: ShellData
  children: React.ReactNode
}) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

/**
 * Throws when used outside the provider rather than falling back to demo data.
 * A dashboard quietly showing a fictional clinic is the exact failure this
 * context exists to remove.
 */
export function useShell(): ShellData {
  const value = useContext(ShellContext)

  if (!value) {
    throw new Error(
      "useShell() must be used inside <ShellProvider>. Wrap the route in app/w/[workspace]/layout.tsx."
    )
  }

  return value
}
