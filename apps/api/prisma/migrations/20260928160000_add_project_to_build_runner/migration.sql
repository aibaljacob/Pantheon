-- AlterTable
ALTER TABLE "BuildRunner" ADD COLUMN "projectId" TEXT;

-- Backfill existing runners
UPDATE "BuildRunner" 
SET "projectId" = '6fc7a4e3-728d-4484-a7a3-fa9f0dc46698' 
WHERE "id" IN ('60b76475-bd36-43fa-8995-9a27c5b9af0c', 'cca0ad28-e9af-49c2-8ebd-b31e7eae9c81') AND "projectId" IS NULL;

UPDATE "BuildRunner" 
SET "projectId" = 'ee90bc91-c345-4a83-b269-77135fd36fdb' 
WHERE "id" = 'ee164bc8-f50d-45bc-ba09-c256077e0eb4' AND "projectId" IS NULL;

UPDATE "BuildRunner" 
SET "projectId" = (SELECT "id" FROM "Project" LIMIT 1) 
WHERE "projectId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "BuildRunner" ALTER COLUMN "projectId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "BuildRunner_projectId_idx" ON "BuildRunner"("projectId");

-- AddForeignKey
ALTER TABLE "BuildRunner" ADD CONSTRAINT "BuildRunner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
