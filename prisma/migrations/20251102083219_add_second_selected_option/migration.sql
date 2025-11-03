-- AlterTable
ALTER TABLE "public"."AttemptDetail" ADD COLUMN     "selectedOption2Id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."AttemptDetail" ADD CONSTRAINT "AttemptDetail_selectedOption2Id_fkey" FOREIGN KEY ("selectedOption2Id") REFERENCES "public"."ExerciseOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
