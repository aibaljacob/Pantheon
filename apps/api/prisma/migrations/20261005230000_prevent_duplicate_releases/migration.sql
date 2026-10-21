-- Safely handle existing duplicate releases before adding the unique constraint
-- Existing duplicate releases are preserved and disambiguated rather than deleted:
UPDATE "PlayableBuild"
SET "version" = "version" || '-duplicate-' || SUBSTRING("id", 1, 8)
WHERE "id" IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY "projectId", "version", "platform"
                   ORDER BY "createdAt" ASC, "id" ASC
               ) as rn
        FROM "PlayableBuild"
    ) sub
    WHERE sub.rn > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayableBuild_projectId_version_platform_key" ON "PlayableBuild"("projectId", "version", "platform");
