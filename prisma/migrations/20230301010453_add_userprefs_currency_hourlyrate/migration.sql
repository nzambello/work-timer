-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT '€',
ADD COLUMN     "defaultHourlyRate" DOUBLE PRECISION;
