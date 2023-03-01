/*
  Warnings:

  - You are about to drop the column `defaultCurrency` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "defaultCurrency",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT '€';
