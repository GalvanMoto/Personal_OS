import { requireWorkspace } from "@/lib/auth/dal"
import { getCommitmentsProgressSummary } from "@/lib/domain/commitments"
import { CommitmentsMatrix } from "@/components/commitments/commitments-matrix"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CommitmentsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const { db } = await requireWorkspace(workspace)

  const [summary, organizations, brands] = await Promise.all([
    getCommitmentsProgressSummary(db),
    db.organization.findMany({
      where: { kind: "CLIENT" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.brand.findMany({
      select: { id: true, name: true, organizationId: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <CommitmentsMatrix
      workspace={workspace}
      summary={summary}
      organizations={organizations}
      brands={brands}
    />
  )
}
