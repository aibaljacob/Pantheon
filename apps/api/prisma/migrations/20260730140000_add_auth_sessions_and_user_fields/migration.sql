-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMINISTRATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "projectsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "unreadNotifications" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "unreadMessages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "refreshTokenVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthSession" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_accessToken_key" ON "AuthSession"("accessToken");
CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_refreshToken_key" ON "AuthSession"("refreshToken");
CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "AuthSession"
    ADD CONSTRAINT "AuthSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
