/*
  Warnings:

  - You are about to drop the column `columnId` on the `Column` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `Task` table. All the data in the column will be lost.
  - Added the required column `columnPosition` to the `Column` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskPosition` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Column` DROP COLUMN `columnId`,
    ADD COLUMN `columnPosition` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Task` DROP COLUMN `taskId`,
    ADD COLUMN `taskPosition` INTEGER NOT NULL;
