-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "shipDateApprox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingGroupId" TEXT;

-- CreateTable
CREATE TABLE "ShippingGroup" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_shippingGroupId_fkey" FOREIGN KEY ("shippingGroupId") REFERENCES "ShippingGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
