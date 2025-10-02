-- This is a baseline migration to track existing schema changes
-- The following changes already exist in the database (applied via db push):
-- - Added SentenceImage table
-- - Added Sentence table  
-- - Added hintEn and hintVi columns to Exercise table
-- - Added isCompleted column to Lesson table

-- CreateTable (SentenceImage) - Already exists, using DO $$ block to handle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'SentenceImage') THEN
        CREATE TABLE "public"."SentenceImage" (
            "id" SERIAL NOT NULL,
            "topicId" INTEGER NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "audioUrl" TEXT,
            "order" INTEGER NOT NULL DEFAULT 0,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "SentenceImage_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateTable (Sentence) - Already exists, using DO $$ block to handle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Sentence') THEN
        CREATE TABLE "public"."Sentence" (
            "id" SERIAL NOT NULL,
            "sentenceImageId" INTEGER NOT NULL,
            "text" TEXT NOT NULL,
            "meaningVi" TEXT,
            "hintVi" TEXT,
            "audioUrl" TEXT,
            "order" INTEGER NOT NULL DEFAULT 0,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- AlterTable Exercise - Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Exercise' AND column_name = 'hintEn') THEN
        ALTER TABLE "public"."Exercise" ADD COLUMN "hintEn" TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Exercise' AND column_name = 'hintVi') THEN
        ALTER TABLE "public"."Exercise" ADD COLUMN "hintVi" TEXT;
    END IF;
END $$;

-- AlterTable Lesson - Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'isCompleted') THEN
        ALTER TABLE "public"."Lesson" ADD COLUMN "isCompleted" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- CreateIndex (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'SentenceImage_topicId_order_key') THEN
        CREATE UNIQUE INDEX "SentenceImage_topicId_order_key" ON "public"."SentenceImage"("topicId", "order");
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Sentence_sentenceImageId_order_key') THEN
        CREATE UNIQUE INDEX "Sentence_sentenceImageId_order_key" ON "public"."Sentence"("sentenceImageId", "order");
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'SentenceImage_topicId_fkey' 
        AND connamespace = 'public'::regnamespace
    ) THEN
        ALTER TABLE "public"."SentenceImage" ADD CONSTRAINT "SentenceImage_topicId_fkey" 
        FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Sentence_sentenceImageId_fkey' 
        AND connamespace = 'public'::regnamespace
    ) THEN
        ALTER TABLE "public"."Sentence" ADD CONSTRAINT "Sentence_sentenceImageId_fkey" 
        FOREIGN KEY ("sentenceImageId") REFERENCES "public"."SentenceImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

