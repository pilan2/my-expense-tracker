/*
  Warnings:

  - Added the required column `detail` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "detail" TEXT NOT NULL DEFAULT '(미입력)',
ADD COLUMN     "series" TEXT;

-- Drop the temporary default now that existing rows are backfilled; new rows must supply a value.
ALTER TABLE "Item" ALTER COLUMN "detail" DROP DEFAULT;
