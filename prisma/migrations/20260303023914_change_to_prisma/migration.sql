-- DropForeignKey
ALTER TABLE "mood_logs" DROP CONSTRAINT "mood_logs_userMedicationId_fkey";

-- AlterTable
ALTER TABLE "mood_logs" ALTER COLUMN "userMedicationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "mood_logs" ADD CONSTRAINT "mood_logs_userMedicationId_fkey" FOREIGN KEY ("userMedicationId") REFERENCES "user_medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
