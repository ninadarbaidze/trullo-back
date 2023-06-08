/*
  Warnings:

  - You are about to drop the column `userId` on the `Board` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Board` DROP FOREIGN KEY `Board_userId_fkey`;

-- AlterTable
ALTER TABLE `Board` DROP COLUMN `userId`,
    ADD COLUMN `image` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Task` ADD COLUMN `image` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `UsersOnBoards` (
    `userId` INTEGER NOT NULL,
    `boardId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `boardId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

-- AddForeignKey
ALTER TABLE `UsersOnBoards` ADD CONSTRAINT `UsersOnBoards_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsersOnBoards` ADD CONSTRAINT `UsersOnBoards_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
