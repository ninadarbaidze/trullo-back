/*
  Warnings:

  - Added the required column `columnId` to the `Column` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Column` ADD COLUMN `columnId` VARCHAR(191) NOT NULL;
