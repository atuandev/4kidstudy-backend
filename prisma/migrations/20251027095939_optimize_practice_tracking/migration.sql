/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `xpEarned` on the `Attempt` table. All the data in the column will be lost.
  - You are about to drop the column `answerText` on the `AttemptDetail` table. All the data in the column will be lost.
  - You are about to drop the column `timeMs` on the `AttemptDetail` table. All the data in the column will be lost.
  - You are about to drop the `MediaAsset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Attempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AttemptDetail` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MediaAsset" DROP CONSTRAINT "MediaAsset_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."Attempt_completedAt_idx";

-- AlterTable
ALTER TABLE "public"."Attempt" DROP COLUMN "completedAt",
DROP COLUMN "startedAt",
DROP COLUMN "xpEarned",
ADD COLUMN     "accuracyPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "incorrectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skipCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."AttemptDetail" DROP COLUMN "answerText",
DROP COLUMN "timeMs",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxPoints" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "timeSec" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."MediaAsset";

-- CreateIndex
CREATE INDEX "Attempt_userId_idx" ON "public"."Attempt"("userId");

-- CreateIndex
CREATE INDEX "Attempt_lessonId_idx" ON "public"."Attempt"("lessonId");

-- CreateIndex
CREATE INDEX "AttemptDetail_attemptId_idx" ON "public"."AttemptDetail"("attemptId");

-- CreateIndex
CREATE INDEX "AttemptDetail_exerciseId_idx" ON "public"."AttemptDetail"("exerciseId");

-- CreateIndex
CREATE INDEX "AttemptDetail_exerciseId_isCorrect_idx" ON "public"."AttemptDetail"("exerciseId", "isCorrect");

-- CreateIndex
CREATE INDEX "AttemptDetail_isCorrect_createdAt_idx" ON "public"."AttemptDetail"("isCorrect", "createdAt");
