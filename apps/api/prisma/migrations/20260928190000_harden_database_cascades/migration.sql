-- DropForeignKey
ALTER TABLE "PlaytestFeedback" DROP CONSTRAINT IF EXISTS "PlaytestFeedback_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "PlaytestSession" DROP CONSTRAINT IF EXISTS "PlaytestSession_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PlaytestSession" DROP CONSTRAINT IF EXISTS "PlaytestSession_playableBuildId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_founderId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT IF EXISTS "ProjectMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "RepoCommit" DROP CONSTRAINT IF EXISTS "RepoCommit_authorId_fkey";

-- AlterTable
ALTER TABLE "PlaytestFeedback" ALTER COLUMN "reporterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PlaytestSession" ALTER COLUMN "playableBuildId" DROP NOT NULL,
ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProjectMember" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RepoCommit" ALTER COLUMN "authorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepoCommit" ADD CONSTRAINT "RepoCommit_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestSession" ADD CONSTRAINT "PlaytestSession_playableBuildId_fkey" FOREIGN KEY ("playableBuildId") REFERENCES "PlayableBuild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestSession" ADD CONSTRAINT "PlaytestSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaytestFeedback" ADD CONSTRAINT "PlaytestFeedback_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
