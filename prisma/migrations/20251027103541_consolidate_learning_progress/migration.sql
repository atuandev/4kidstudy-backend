-- CreateEnum
CREATE TYPE "public"."LearningContentType" AS ENUM ('FLASHCARD', 'SENTENCE');

-- CreateTable
CREATE TABLE "public"."LearningProgress" (
    "id" SERIAL NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "lastReviewedAt" TIMESTAMP(3),
    "contentType" "public"."LearningContentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "flashcardId" INTEGER,
    "sentenceId" INTEGER,

    CONSTRAINT "LearningProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningProgress_userId_idx" ON "public"."LearningProgress"("userId");

-- CreateIndex
CREATE INDEX "LearningProgress_flashcardId_idx" ON "public"."LearningProgress"("flashcardId");

-- CreateIndex
CREATE INDEX "LearningProgress_sentenceId_idx" ON "public"."LearningProgress"("sentenceId");

-- CreateIndex
CREATE INDEX "LearningProgress_userId_contentType_isMastered_idx" ON "public"."LearningProgress"("userId", "contentType", "isMastered");

-- CreateIndex
CREATE INDEX "LearningProgress_contentType_idx" ON "public"."LearningProgress"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_contentType_flashcardId_key" ON "public"."LearningProgress"("userId", "contentType", "flashcardId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_contentType_sentenceId_key" ON "public"."LearningProgress"("userId", "contentType", "sentenceId");

-- AddForeignKey
ALTER TABLE "public"."LearningProgress" ADD CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningProgress" ADD CONSTRAINT "LearningProgress_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "public"."Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningProgress" ADD CONSTRAINT "LearningProgress_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "public"."Sentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
