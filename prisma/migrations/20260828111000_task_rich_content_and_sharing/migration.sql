-- AlterTable
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "content" JSONB;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "linkUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_shareToken_key" ON "tasks"("shareToken");

-- AlterTable
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "documents_shareToken_key" ON "documents"("shareToken");
