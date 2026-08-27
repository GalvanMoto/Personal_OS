-- Allow multiple Gmail accounts per workspace (accountRef distinguishes)
ALTER TABLE "integrations" DROP CONSTRAINT IF EXISTS "integrations_tenantId_provider_key";
CREATE UNIQUE INDEX "integrations_tenantId_provider_accountRef_key" ON "integrations"("tenantId", "provider", "accountRef");
CREATE INDEX "integrations_tenantId_provider_idx" ON "integrations"("tenantId", "provider");
