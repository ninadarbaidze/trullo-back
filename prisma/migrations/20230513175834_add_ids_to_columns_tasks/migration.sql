/*
  Warnings:

  - Added the required column `columnId` to the `ColumnOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ColumnOrder` ADD COLUMN `columnId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `taskId` INTEGER NOT NULL;
