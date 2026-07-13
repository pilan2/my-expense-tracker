"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";
import { calcRemainingQuantity } from "@/lib/sales";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function createSale(itemId: string, formData: FormData) {
  await requireAuth();

  const quantitySold = Number(formData.get("quantitySold"));
  const saleAmount = manwonToWon(String(formData.get("saleAmount") ?? "0"));
  const saleDateRaw = formData.get("saleDate");
  const saleDate = saleDateRaw ? new Date(String(saleDateRaw)) : new Date();

  const item = await prisma.item.findUniqueOrThrow({
    where: { id: itemId },
    include: { sales: { select: { quantitySold: true } } },
  });
  const remaining = calcRemainingQuantity(item.quantity, item.sales);

  if (quantitySold < 1 || quantitySold > remaining) {
    throw new Error("판매 수량은 1개 이상, 잔여 수량 이하여야 합니다.");
  }

  await prisma.sale.create({ data: { itemId, quantitySold, saleAmount, saleDate } });

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}

export async function deleteSale(saleId: string) {
  await requireAuth();

  const sale = await prisma.sale.delete({ where: { id: saleId } });

  revalidatePath("/items");
  revalidatePath(`/items/${sale.itemId}`);
  revalidatePath("/");
}
