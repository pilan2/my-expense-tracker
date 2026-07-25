-- DropForeignKey
ALTER TABLE "EventChecklistItem" DROP CONSTRAINT "EventChecklistItem_itemId_fkey";

-- AddForeignKey
ALTER TABLE "EventChecklistItem" ADD CONSTRAINT "EventChecklistItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
