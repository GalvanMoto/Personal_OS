-- CreateTable
CREATE TABLE "search_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "href" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_documents_tenantId_entityType_idx" ON "search_documents"("tenantId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "search_documents_tenantId_entityType_entityId_key" ON "search_documents"("tenantId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "search_documents" ADD CONSTRAINT "search_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Full-text search support.
--
-- The vector is a GENERATED column rather than a trigger-maintained one: it can
-- never drift from the row it describes, and there is no trigger to forget when
-- a new write path appears. Title is weighted above body so an exact name match
-- outranks a passing mention.
ALTER TABLE "search_documents"
  ADD COLUMN "tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("body", '')), 'B')
  ) STORED;

CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING GIN ("tsv");

-- Trigram matching catches the misspellings and partial names full-text stemming
-- misses ("tanniaqua" vs "taniaqua"), which is most of how people actually
-- search for their own clients.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "search_documents_title_trgm_idx"
  ON "search_documents" USING GIN ("title" gin_trgm_ops);
