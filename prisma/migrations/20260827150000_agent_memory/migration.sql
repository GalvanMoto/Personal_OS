-- CreateTable agent_memories (what the assistant carries between conversations)
CREATE TABLE "agent_memories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FACT',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "history" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceType" "SourceType" NOT NULL DEFAULT 'AGENT',
    "sourceRef" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "agent_memories_tenantId_key_key" ON "agent_memories"("tenantId", "key");
CREATE INDEX "agent_memories_tenantId_kind_idx" ON "agent_memories"("tenantId", "kind");
CREATE INDEX "agent_memories_tenantId_pinned_idx" ON "agent_memories"("tenantId", "pinned");
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
