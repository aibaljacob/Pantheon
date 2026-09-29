-- CreateTable
CREATE TABLE "GameBlueprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tagline" TEXT,
    "targetAudience" TEXT,
    "cameraPerspective" TEXT,
    "artStyle" TEXT,
    "audioTone" TEXT,
    "networkModel" TEXT,
    "targetFps" INTEGER,
    "targetResolution" TEXT,
    "coreLoop" TEXT,
    "summary" TEXT,
    "pillars" JSONB,
    "keyFeatures" JSONB,
    "targetSpecs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameBlueprint_projectId_key" ON "GameBlueprint"("projectId");

-- CreateIndex
CREATE INDEX "GameBlueprint_projectId_idx" ON "GameBlueprint"("projectId");

-- AddForeignKey
ALTER TABLE "GameBlueprint" ADD CONSTRAINT "GameBlueprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
