-- AlterTable
ALTER TABLE "mood_logs" ADD COLUMN     "anhedonia" INTEGER,
ADD COLUMN     "concentrationScore" INTEGER,
ADD COLUMN     "functionalImpairment" INTEGER,
ADD COLUMN     "medicationAdherence" BOOLEAN,
ADD COLUMN     "overallScore" DOUBLE PRECISION;
