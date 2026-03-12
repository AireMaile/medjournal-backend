/*
  Warnings:

  - You are about to drop the column `medicationAdherence` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userMedicationId` on the `mood_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "mood_logs" DROP CONSTRAINT "mood_logs_userMedicationId_fkey";

-- AlterTable
ALTER TABLE "mood_logs" DROP COLUMN "medicationAdherence",
DROP COLUMN "userMedicationId",
ALTER COLUMN "moodScore" DROP NOT NULL,
ALTER COLUMN "energyScore" DROP NOT NULL,
ALTER COLUMN "logType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "medication_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userMedicationId" TEXT NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "taken" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_logs" ADD CONSTRAINT "medication_logs_userMedicationId_fkey" FOREIGN KEY ("userMedicationId") REFERENCES "user_medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
