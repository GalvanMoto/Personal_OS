import "server-only"

import { prisma } from "@/lib/db/client"

/// Models that are deliberately not tenant-scoped: identity and the tenancy
/// bookkeeping itself, which has to be queried across tenants (to list the
/// workspaces a user belongs to, for example).
export const PLATFORM_MODELS = new Set([
  "User",
  "Session",
  "Tenant",
  "Membership",
  "Invitation",
])

/// Every model carrying a `tenantId`. Queries against these are rewritten to
/// include the active tenant, on both reads and writes.
export const TENANT_MODELS = new Set([
  "Organization",
  "Person",
  "Project",
  "Task",
  "TaskChecklistItem",
  "InboxItem",
  "FileObject",
  "Document",
  "LinkResource",
  "Note",
  "EmailMessage",
  "CalendarEvent",
  "Reminder",
  "Notification",
  "Conversation",
  "ChatMessage",
  "ContextPack",
  "Provenance",
  "EntityLink",
  "DomainEvent",
  "Job",
  "JobRun",
  "ActivityLog",
  "ApprovalRequest",
  "Integration",
  "AutomationRule",
  "FinancialAccount",
  "Transaction",
  "Subscription",
  "SearchDocument",
  "VaultSecret",
  "Brand",
  "RecurringCommitment",
  "CommitmentOccurrence",
  "AgentMemory",
])

/// Operations whose `where` we filter. Prisma's extended-where-unique lets us
/// add `tenantId` alongside the unique field, so `update`/`delete` are covered
/// too — a row from another tenant simply does not match.
const WHERE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "delete",
  "deleteMany",
  "upsert",
])

const CREATE_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "upsert",
])

type AnyArgs = Record<string, unknown>

function stampTenant(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) {
    return data.map((row) => stampTenant(row, tenantId))
  }
  if (data && typeof data === "object") {
    return { ...(data as AnyArgs), tenantId }
  }
  return data
}

/**
 * Returns a Prisma client locked to a single tenant.
 *
 * Reads are filtered by `tenantId` and writes are stamped with it, so a missing
 * `where` clause at a call site leaks nothing. An unrecognised model throws
 * rather than falling through unscoped: adding a model to the schema forces an
 * explicit decision about whether it is tenant-owned.
 */
export function tenantDb(tenantId: string) {
  if (!tenantId) {
    throw new Error("tenantDb() requires a tenant id")
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (PLATFORM_MODELS.has(model)) {
            return query(args)
          }

          if (!TENANT_MODELS.has(model)) {
            throw new Error(
              `Model "${model}" is not classified in lib/db/tenant.ts. ` +
                "Add it to TENANT_MODELS or PLATFORM_MODELS."
            )
          }

          const next = { ...(args as AnyArgs) }

          if (WHERE_OPERATIONS.has(operation)) {
            const where: AnyArgs = { ...((next.where as AnyArgs) ?? {}) }

            // A compound unique that leads with tenantId arrives as a nested
            // object (`tenantId_fromType_fromId: { ... }`). Filling only the
            // top level would leave that nested tenantId blank and the lookup
            // would silently miss, so fill it in place as well.
            for (const key of Object.keys(where)) {
              const value = where[key]
              if (
                key.startsWith("tenantId_") &&
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
              ) {
                where[key] = { ...(value as AnyArgs), tenantId }
              }
            }

            where.tenantId = tenantId
            next.where = where
          }

          if (CREATE_OPERATIONS.has(operation)) {
            if (operation === "upsert") {
              next.create = stampTenant(next.create, tenantId)
              next.update = stampTenant(next.update, tenantId)
            } else {
              next.data = stampTenant(next.data, tenantId)
            }
          }

          return query(next)
        },
      },
    },
  })
}

export type TenantDb = ReturnType<typeof tenantDb>
