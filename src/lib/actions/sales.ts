"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";
import { calcRemainingQuantity } from "@/lib/sales";
import { splitProportionally } from "@/lib/split";

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

// 여러 품목을 한 건으로 묶어 팔 때: 총 판매액을 (구매 단가 × 판매 수량) 비율로 나눠
// 품목별 Sale을 만든다.
export async function createBulkSale(formData: FormData) {
  await requireAuth();

  const itemIds = [...new Set(formData.getAll("itemIds").map(String))];
  const totalSaleWon = Number(manwonToWon(String(formData.get("totalSaleAmount") ?? "0")));
  const saleDateRaw = formData.get("saleDate");
  const saleDate = saleDateRaw ? new Date(String(saleDateRaw)) : new Date();

  if (itemIds.length < 2) {
    throw new Error("묶음 판매는 품목을 2개 이상 선택해야 합니다.");
  }
  if (totalSaleWon <= 0) {
    throw new Error("판매 금액을 입력해주세요.");
  }

  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    include: { sales: { select: { quantitySold: true } } },
  });

  const quantities = items.map((item) => {
    const remaining = calcRemainingQuantity(item.quantity, item.sales);
    const requested = Number(formData.get(`quantity_${item.id}`) ?? 0);
    if (requested < 1 || requested > remaining) {
      throw new Error(`${item.detail}의 판매 수량이 올바르지 않습니다.`);
    }
    return requested;
  });

  const weights = items.map((item, i) => Number(item.price) * quantities[i]);
  const shares = splitProportionally(totalSaleWon, weights);

  await prisma.$transaction(
    items.map((item, i) =>
      prisma.sale.create({
        data: { itemId: item.id, quantitySold: quantities[i], saleAmount: shares[i], saleDate },
      }),
    ),
  );

  revalidatePath("/items");
  revalidatePath("/");
  redirect("/items");
}

export async function deleteSale(saleId: string) {
  await requireAuth();

  const sale = await prisma.sale.delete({ where: { id: saleId } });

  revalidatePath("/items");
  revalidatePath(`/items/${sale.itemId}`);
  revalidatePath("/");
}
