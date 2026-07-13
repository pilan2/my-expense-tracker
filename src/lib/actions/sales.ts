"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";

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

  await prisma.$transaction(async (tx) => {
    const item = await tx.item.findUniqueOrThrow({ where: { id: itemId } });

    if (quantitySold < 1 || quantitySold > item.quantity) {
      throw new Error("판매 수량은 1개 이상, 보유 수량 이하여야 합니다.");
    }

    await tx.sale.create({ data: { itemId, quantitySold, saleAmount, saleDate } });
    await tx.item.update({
      where: { id: itemId },
      data: { quantity: item.quantity - quantitySold },
    });
  });

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}

export async function deleteSale(saleId: string) {
  await requireAuth();

  const itemId = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({ where: { id: saleId } });
    await tx.item.update({
      where: { id: sale.itemId },
      data: { quantity: { increment: sale.quantitySold } },
    });
    await tx.sale.delete({ where: { id: saleId } });
    return sale.itemId;
  });

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}
