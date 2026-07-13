import "server-only";
import { prisma } from "@/lib/prisma";

export function getSalesForItem(itemId: string) {
  return prisma.sale.findMany({ where: { itemId }, orderBy: { saleDate: "desc" } });
}
