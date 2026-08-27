import "server-only"

import type { IntegrationProvider } from "@/lib/generated/prisma/enums"
import type { TenantDb } from "@/lib/db/tenant"
import { decryptSecret, encryptSecret } from "@/lib/security/secret"
import { gmailProvider, refreshAccessToken, type StoredTokens } from "./gmail"
import type { EmailProvider } from "./types"

export * from "./drive"
export * from "./calendar"
export * from "./gmail"

/**
 * Picks the right adapter for a connected provider.
 */
export function emailProviderFor(provider: IntegrationProvider): EmailProvider | null {
  switch (provider) {
    case "GMAIL":
      return gmailProvider
    default:
      return null
  }
}

type TokenedIntegration = {
  id: string
  provider: IntegrationProvider
  secretCipher: string | null
}

/**
 * Returns a usable access token, transparently refreshing (and persisting) an
 * expired one. Callers never see the refresh token or the cipher.
 */
export async function getAccessToken(
  db: TenantDb,
  integration: TokenedIntegration
): Promise<string> {
  if (!integration.secretCipher) {
    throw new Error("Integration has no stored credentials.")
  }

  const tokens = JSON.parse(decryptSecret(integration.secretCipher)) as StoredTokens

  // 30s leeway so a token that expires mid-request is still refreshed.
  if (tokens.expiresAt > Date.now() + 30_000) {
    return tokens.accessToken
  }

  if (!tokens.refreshToken) {
    throw new Error("Access token expired and no refresh token is stored.")
  }

  const refreshed = await refreshAccessToken(tokens.refreshToken)
  const next: StoredTokens = {
    ...tokens,
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
  }

  await db.integration.update({
    where: { id: integration.id },
    data: { secretCipher: encryptSecret(JSON.stringify(next)) },
  })

  return next.accessToken
}

