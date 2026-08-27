import { AuthShell } from "@/components/auth/auth-shell"
import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form"
import { requireUser } from "@/lib/auth/dal"

export const metadata = { title: "New workspace · Personal OS" }

export default async function NewWorkspacePage() {
  await requireUser()

  return (
    <AuthShell
      title="Create a workspace"
      description="Workspaces keep separate worlds of work fully isolated."
    >
      <CreateWorkspaceForm />
    </AuthShell>
  )
}
