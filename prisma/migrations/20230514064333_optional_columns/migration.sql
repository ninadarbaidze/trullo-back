-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_columnId_fkey`;

-- AlterTable
ALTER TABLE `Task` MODIFY `columnId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_columnId_fkey` FOREIGN KEY (`columnId`) REFERENCES `Column`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
