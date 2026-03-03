/*
  Warnings:

  - You are about to drop the column `dosage` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `mood_logs` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user_medications` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
*/

-- DropForeignKey
ALTER TABLE "mood_logs" DROP CONSTRAINT "mood_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_medications" DROP CONSTRAINT "user_medications_userId_fkey";

-- AlterTable: mood_logs
ALTER TABLE "mood_logs" DROP COLUMN "dosage",
DROP COLUMN "note",
ADD COLUMN     "anxietyScore" INTEGER,
ADD COLUMN     "appetiteScore" INTEGER,
ADD COLUMN     "detailedNote" TEXT,
ADD COLUMN     "logType" TEXT NOT NULL DEFAULT 'QUICK',
ADD COLUMN     "quickNote" TEXT,
ADD COLUMN     "sleepHours" DOUBLE PRECISION,
ADD COLUMN     "sleepQuality" INTEGER,
ADD COLUMN     "socialMotivation" INTEGER;

ALTER TABLE "mood_logs" ALTER COLUMN "logType" DROP DEFAULT;

-- AlterTable: user_medications
ALTER TABLE "user_medications" DROP COLUMN "name",
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "dosage" TEXT NOT NULL DEFAULT '50mg';

ALTER TABLE "user_medications" ALTER COLUMN "dosage" DROP DEFAULT;

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "notificationTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_medications" ADD CONSTRAINT "user_medications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_logs" ADD CONSTRAINT "mood_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
