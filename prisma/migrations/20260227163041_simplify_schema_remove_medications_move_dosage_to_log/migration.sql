/*
  Warnings:

  - You are about to drop the column `anxietyScore` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `appetiteScore` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `detailedNote` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `logType` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `quickNote` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `sleepHours` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `sleepQuality` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `socialMotivation` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `customName` on the `user_medications` table. All the data in the column will be lost.
  - You are about to drop the column `dosage` on the `user_medications` table. All the data in the column will be lost.
  - You are about to drop the column `medicationId` on the `user_medications` table. All the data in the column will be lost.
  - You are about to drop the `medications` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dosage` to the `mood_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `user_medications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_medications" DROP CONSTRAINT "user_medications_medicationId_fkey";

-- AlterTable: mood_logs
-- Drop old columns, add dosage with a temporary default for existing rows, then remove the default
ALTER TABLE "mood_logs" DROP COLUMN "anxietyScore",
DROP COLUMN "appetiteScore",
DROP COLUMN "detailedNote",
DROP COLUMN "logType",
DROP COLUMN "quickNote",
DROP COLUMN "sleepHours",
DROP COLUMN "sleepQuality",
DROP COLUMN "socialMotivation",
ADD COLUMN     "dosage" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "note" TEXT;

ALTER TABLE "mood_logs" ALTER COLUMN "dosage" DROP DEFAULT;

-- AlterTable: user_medications
-- Drop old columns, add name with a temporary default for existing rows, then remove the default
ALTER TABLE "user_medications" DROP COLUMN "customName",
DROP COLUMN "dosage",
DROP COLUMN "medicationId",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE "user_medications" ALTER COLUMN "name" DROP DEFAULT;

-- DropTable
DROP TABLE "medications";

-- DropEnum
DROP TYPE "LogType";
