/*
  Warnings:

  - You are about to drop the column `pdf` on the `report` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `report` DROP COLUMN `pdf`,
    ADD COLUMN `fileName` VARCHAR(191) NOT NULL,
    ADD COLUMN `filePath` VARCHAR(191) NOT NULL;
