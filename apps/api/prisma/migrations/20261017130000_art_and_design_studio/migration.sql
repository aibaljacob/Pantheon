-- CreateEnum
CREATE TYPE "ArtProposalCategory" AS ENUM ('CHARACTERS_COSTUMES', 'ENVIRONMENTS_ARCHITECTURE', 'PROPS_WEAPONS', 'UI_ICONS', 'LIGHTING_COLOR');

-- CreateEnum
CREATE TYPE "ArtProposalStatus" AS ENUM ('DRAFT', 'IN_VOTING', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DesignAssetCategory" AS ENUM ('CHARACTERS_COSTUMES', 'ENVIRONMENTS_ARCHITECTURE', 'PROPS_WEAPONS', 'UI_ICONS', 'LIGHTING_COLOR');

-- CreateEnum
CREATE TYPE "DesignAssetStatus" AS ENUM ('PROPOSED', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArtVoteType" AS ENUM ('APPROVE', 'DISAPPROVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "ArtProposal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ArtProposalCategory" NOT NULL DEFAULT 'ENVIRONMENTS_ARCHITECTURE',
    "status" "ArtProposalStatus" NOT NULL DEFAULT 'IN_VOTING',
    "rationale" TEXT NOT NULL,
    "designNotes" TEXT,
    "paletteColors" JSONB,
    "referenceImages" JSONB,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "founderDecision" TEXT,
    "decisionNotes" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdTaskId" TEXT,
    "revisions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtProposalVote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "voteType" "ArtVoteType" NOT NULL DEFAULT 'APPROVE',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtProposalVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtProposalComment" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtProposalComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DesignAssetCategory" NOT NULL DEFAULT 'ENVIRONMENTS_ARCHITECTURE',
    "status" "DesignAssetStatus" NOT NULL DEFAULT 'PROPOSED',
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceDetails" TEXT,
    "creatorDetails" TEXT,
    "licenseDetails" TEXT,
    "paletteColors" JSONB,
    "proposalId" TEXT,
    "createdTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtProposal_projectId_idx" ON "ArtProposal"("projectId");
CREATE INDEX "ArtProposal_authorId_idx" ON "ArtProposal"("authorId");
CREATE INDEX "ArtProposal_status_idx" ON "ArtProposal"("status");
CREATE INDEX "ArtProposal_category_idx" ON "ArtProposal"("category");
CREATE INDEX "ArtProposal_createdTaskId_idx" ON "ArtProposal"("createdTaskId");

-- CreateIndex
CREATE INDEX "ArtProposalVote_proposalId_idx" ON "ArtProposalVote"("proposalId");
CREATE INDEX "ArtProposalVote_userId_idx" ON "ArtProposalVote"("userId");
CREATE UNIQUE INDEX "ArtProposalVote_proposalId_userId_round_key" ON "ArtProposalVote"("proposalId", "userId", "round");

-- CreateIndex
CREATE INDEX "ArtProposalComment_proposalId_idx" ON "ArtProposalComment"("proposalId");
CREATE INDEX "ArtProposalComment_authorId_idx" ON "ArtProposalComment"("authorId");

-- CreateIndex
CREATE INDEX "DesignAsset_projectId_idx" ON "DesignAsset"("projectId");
CREATE INDEX "DesignAsset_authorId_idx" ON "DesignAsset"("authorId");
CREATE INDEX "DesignAsset_category_idx" ON "DesignAsset"("category");
CREATE INDEX "DesignAsset_status_idx" ON "DesignAsset"("status");
CREATE INDEX "DesignAsset_proposalId_idx" ON "DesignAsset"("proposalId");
CREATE INDEX "DesignAsset_createdTaskId_idx" ON "DesignAsset"("createdTaskId");

-- AddForeignKey
ALTER TABLE "ArtProposal" ADD CONSTRAINT "ArtProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtProposal" ADD CONSTRAINT "ArtProposal_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtProposal" ADD CONSTRAINT "ArtProposal_createdTaskId_fkey" FOREIGN KEY ("createdTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtProposalVote" ADD CONSTRAINT "ArtProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ArtProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtProposalVote" ADD CONSTRAINT "ArtProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtProposalComment" ADD CONSTRAINT "ArtProposalComment_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ArtProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArtProposalComment" ADD CONSTRAINT "ArtProposalComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignAsset" ADD CONSTRAINT "DesignAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DesignAsset" ADD CONSTRAINT "DesignAsset_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DesignAsset" ADD CONSTRAINT "DesignAsset_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ArtProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DesignAsset" ADD CONSTRAINT "DesignAsset_createdTaskId_fkey" FOREIGN KEY ("createdTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
