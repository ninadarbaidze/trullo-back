/*
  Warnings:

  - You are about to drop the column `columnOrderId` on the `Column` table. All the data in the column will be lost.
  - You are about to drop the `ColumnOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Column` DROP FOREIGN KEY `Column_columnOrderId_fkey`;

-- DropForeignKey
ALTER TABLE `ColumnOrder` DROP FOREIGN KEY `ColumnOrder_boardId_fkey`;

-- AlterTable
ALTER TABLE `Column` DROP COLUMN `columnOrderId`;

-- DropTable
DROP TABLE `ColumnOrder`;
