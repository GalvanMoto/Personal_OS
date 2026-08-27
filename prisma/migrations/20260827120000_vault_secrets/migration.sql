-- CreateTable vault_secrets (encrypted PII for statement passwords)
CREATE TABLE "vault_secrets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cipher" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vault_secrets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vault_secrets_tenantId_kind_label_key" ON "vault_secrets"("tenantId", "kind", "label");
CREATE INDEX "vault_secrets_tenantId_idx" ON "vault_secrets"("tenantId");
ALTER TABLE "vault_secrets" ADD CONSTRAINT "vault_secrets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
