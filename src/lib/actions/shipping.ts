"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";
import { splitProportionally } from "@/lib/split";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

// 선택한 품목들에 총 배송비를 수량 비율대로 나눠 각 품목의 shippingFee에 배정한다.
// 배송비가 확정되었으니, "이후 해외배송비 존재" 체크도 함께 해제한다.
export async function assignShippingFee(formData: FormData) {
  await requireAuth();

  const itemIds = formData.getAll("itemIds").map(String);
  const totalFeeWon = Number(manwonToWon(String(formData.get("totalShippingFee") ?? "0")));

  if (itemIds.length === 0) {
    throw new Error("배송비를 나눌 품목을 하나 이상 선택해주세요.");
  }
  if (totalFeeWon <= 0) {
    throw new Error("배송비를 입력해주세요.");
  }

  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, quantity: true },
  });

  const shares = splitProportionally(
    totalFeeWon,
    items.map((item) => item.quantity),
  );

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.item.update({
        where: { id: item.id },
        data: { shippingFee: shares[index], hasOverseasShipping: false },
      }),
    ),
  );

  revalidatePath("/items");
  revalidatePath("/");
}
