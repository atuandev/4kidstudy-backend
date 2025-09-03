/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'LEARNER');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'UNSET');

-- CreateEnum
CREATE TYPE "public"."LessonStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ExerciseType" AS ENUM ('SELECT_IMAGE', 'MULTIPLE_CHOICE', 'MATCHING', 'LISTENING', 'PRONUNCIATION');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."XPSource" AS ENUM ('LESSON_COMPLETE', 'EXERCISE_CORRECT', 'STREAK_BONUS', 'ADMIN_ADJUST', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GradeLevel" AS ENUM ('GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5');

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "dob" TIMESTAMP(3),
    "gender" "public"."Gender" NOT NULL DEFAULT 'UNSET',
    "role" "public"."UserRole" NOT NULL DEFAULT 'LEARNER',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "grade" "public"."GradeLevel" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lesson" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "theoryText" TEXT,
    "phoneticsNote" TEXT,
    "grammarNote" TEXT,
    "audioUrl" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exercise" (
    "id" SERIAL NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "type" "public"."ExerciseType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "targetText" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExerciseOption" (
    "id" SERIAL NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "matchKey" TEXT,

    CONSTRAINT "ExerciseOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Flashcard" (
    "id" SERIAL NOT NULL,
    "topicId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "phonetic" TEXT,
    "meaningVi" TEXT NOT NULL,
    "exampleEn" TEXT,
    "exampleVi" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attempt" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttemptDetail" (
    "id" SERIAL NOT NULL,
    "attemptId" INTEGER NOT NULL,
    "exerciseId" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answerText" TEXT,
    "selectedOptionId" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 0,
    "timeMs" INTEGER,

    CONSTRAINT "AttemptDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PronunciationScore" (
    "id" SERIAL NOT NULL,
    "attemptDetailId" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "fluency" DOUBLE PRECISION,
    "completeness" DOUBLE PRECISION,
    "prosody" DOUBLE PRECISION,
    "overall" DOUBLE PRECISION,
    "rawJson" JSONB,
    "audioUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PronunciationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."XPLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "public"."XPSource" NOT NULL DEFAULT 'OTHER',
    "lessonId" INTEGER,
    "exerciseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StreakLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StreakLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaAsset" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER,
    "type" "public"."MediaType" NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "Topic_grade_isActive_idx" ON "public"."Topic"("grade", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_title_grade_key" ON "public"."Topic"("title", "grade");

-- CreateIndex
CREATE INDEX "Lesson_topicId_status_idx" ON "public"."Lesson"("topicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_topicId_order_key" ON "public"."Lesson"("topicId", "order");

-- CreateIndex
CREATE INDEX "Exercise_lessonId_type_idx" ON "public"."Exercise"("lessonId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_lessonId_order_key" ON "public"."Exercise"("lessonId", "order");

-- CreateIndex
CREATE INDEX "ExerciseOption_exerciseId_idx" ON "public"."ExerciseOption"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseOption_matchKey_idx" ON "public"."ExerciseOption"("matchKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseOption_exerciseId_order_key" ON "public"."ExerciseOption"("exerciseId", "order");

-- CreateIndex
CREATE INDEX "Flashcard_topicId_isActive_idx" ON "public"."Flashcard"("topicId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_topicId_order_key" ON "public"."Flashcard"("topicId", "order");

-- CreateIndex
CREATE INDEX "Attempt_userId_lessonId_idx" ON "public"."Attempt"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "Attempt_completedAt_idx" ON "public"."Attempt"("completedAt");

-- CreateIndex
CREATE INDEX "AttemptDetail_attemptId_exerciseId_idx" ON "public"."AttemptDetail"("attemptId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "PronunciationScore_attemptDetailId_key" ON "public"."PronunciationScore"("attemptDetailId");

-- CreateIndex
CREATE INDEX "XPLog_userId_createdAt_idx" ON "public"."XPLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StreakLog_day_idx" ON "public"."StreakLog"("day");

-- CreateIndex
CREATE UNIQUE INDEX "StreakLog_userId_day_key" ON "public"."StreakLog"("userId", "day");

-- CreateIndex
CREATE INDEX "MediaAsset_type_createdAt_idx" ON "public"."MediaAsset"("type", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_createdAt_idx" ON "public"."MediaAsset"("ownerId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Lesson" ADD CONSTRAINT "Lesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exercise" ADD CONSTRAINT "Exercise_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExerciseOption" ADD CONSTRAINT "ExerciseOption_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Flashcard" ADD CONSTRAINT "Flashcard_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttemptDetail" ADD CONSTRAINT "AttemptDetail_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttemptDetail" ADD CONSTRAINT "AttemptDetail_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttemptDetail" ADD CONSTRAINT "AttemptDetail_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "public"."ExerciseOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PronunciationScore" ADD CONSTRAINT "PronunciationScore_attemptDetailId_fkey" FOREIGN KEY ("attemptDetailId") REFERENCES "public"."AttemptDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XPLog" ADD CONSTRAINT "XPLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StreakLog" ADD CONSTRAINT "StreakLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
