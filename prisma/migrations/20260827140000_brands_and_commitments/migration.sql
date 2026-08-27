-- CreateEnum DeliverableType
CREATE TYPE "DeliverableType" AS ENUM ('REEL', 'POST', 'SHORT', 'STORY', 'REPORT', 'DESIGN', 'NEWSLETTER', 'CUSTOM');

-- CreateEnum CommitmentFrequency
CREATE TYPE "CommitmentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY');

-- CreateEnum CommitmentStatus
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateTable brands
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "color" TEXT,
    "socialLinks" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable recurring_commitments
CREATE TABLE "recurring_commitments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverableType" "DeliverableType" NOT NULL DEFAULT 'REEL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'deliverables',
    "frequency" "CommitmentFrequency" NOT NULL DEFAULT 'WEEKLY',
    "dueDayOfWeek" INTEGER NOT NULL DEFAULT 5,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 45,
    "priority" "TaskPriority" NOT NULL DEFAULT 'HIGH',
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoGenerateTasks" BOOLEAN NOT NULL DEFAULT true,
    "autoRemind" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_commitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable commitment_occurrences
CREATE TABLE "commitment_occurrences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "completedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commitment_occurrences_pkey" PRIMARY KEY ("id")
);

-- AlterTable tasks
ALTER TABLE "tasks" ADD COLUMN "commitmentOccurrenceId" TEXT;

-- CreateIndex
CREATE INDEX "brands_tenantId_organizationId_idx" ON "brands"("tenantId", "organizationId");
CREATE UNIQUE INDEX "brands_tenantId_organizationId_slug_key" ON "brands"("tenantId", "organizationId", "slug");

-- CreateIndex
CREATE INDEX "recurring_commitments_tenantId_status_idx" ON "recurring_commitments"("tenantId", "status");
CREATE INDEX "recurring_commitments_tenantId_organizationId_idx" ON "recurring_commitments"("tenantId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "commitment_occurrences_tenantId_commitmentId_cycleKey_key" ON "commitment_occurrences"("tenantId", "commitmentId", "cycleKey");

-- CreateIndex
CREATE INDEX "tasks_tenantId_commitmentOccurrenceId_idx" ON "tasks"("tenantId", "commitmentOccurrenceId");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brands" ADD CONSTRAINT "brands_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_commitments" ADD CONSTRAINT "recurring_commitments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_commitments" ADD CONSTRAINT "recurring_commitments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_commitments" ADD CONSTRAINT "recurring_commitments_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commitment_occurrences" ADD CONSTRAINT "commitment_occurrences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commitment_occurrences" ADD CONSTRAINT "commitment_occurrences_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "recurring_commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_commitmentOccurrenceId_fkey" FOREIGN KEY ("commitmentOccurrenceId") REFERENCES "commitment_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
