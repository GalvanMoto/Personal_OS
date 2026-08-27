/**
 * Normalized email shape, independent of any provider.
 *
 * Adapters translate raw API responses into this so the rest of the system —
 * storage, entity resolution, classification — never imports a vendor SDK
 * (PRD §45).
 */
export type NormalizedEmail = {
  externalId: string
  threadId?: string
  subject?: string
  fromName?: string
  fromEmail?: string
  toEmails: string[]
  snippet?: string
  body?: string
  receivedAt: Date
  listUnsubscribe?: string | null
  labels?: string[]
  isReply?: boolean
}

/**
 * The contract every mail integration satisfies.
 *
 * `listMessages` returns fully-parsed messages (body included) for a batch so
 * ingestion is a single pass; `getMessage` exists for on-demand fetches.
 */
export interface EmailProvider {
  listMessages(
    accessToken: string,
    cursor?: string,
    query?: string
  ): Promise<{ messages: NormalizedEmail[]; nextCursor?: string }>
  getMessage(accessToken: string, externalId: string): Promise<NormalizedEmail>
}
