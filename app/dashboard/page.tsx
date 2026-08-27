import { redirect } from "next/navigation"
import { getCurrentUser, getWorkspaces } from "@/lib/auth/dal"

export const dynamic = "force-dynamic"

export default async function DashboardRedirectPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const workspaces = await getWorkspaces()
  if (workspaces.length === 0) {
    redirect("/workspaces/new")
  }

  redirect(`/w/${workspaces[0].slug}/today`)
}
