import { redirect } from "next/navigation"

export default async function WorkspaceRootPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  redirect(`/w/${workspace}/today`)
}
