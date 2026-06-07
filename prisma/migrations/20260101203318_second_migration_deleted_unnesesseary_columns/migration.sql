/*
  Warnings:

  - You are about to drop the column `caption` on the `AdContent` table. All the data in the column will be lost.
  - You are about to drop the column `namena` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AdContent" DROP COLUMN "caption";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "namena";
