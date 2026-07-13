"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

// 총액을 quantities 비율대로 나누되, 반올림 오차 없이 합계가 정확히 totalWon이 되도록 배분한다.
// (몫은 버림으로 배분하고, 남는 원 단위는 소수부가 큰 순서대로 1원씩 추가)
function splitByQuantity(totalWon: number, quantities: number[]): number[] {
  const totalQuantity = quantities.reduce((sum, q) => sum + q, 0);
  const raw = quantities.map((q) => (totalWon * q) / totalQuantity);
  const shares = raw.map(Math.floor);
  const remainder = totalWon - shares.reduce((sum, s) => sum + s, 0);

  const orderByFraction = raw
    .map((r, index) => ({ index, fraction: r - Math.floor(r) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i++) {
    shares[orderByFraction[i].index] += 1;
  }

  return shares;
}

// 선택한 품목들에 총 배송비를 수량 비율대로 나눠 각 품목의 shippingFee에 배정한다.
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

  const shares = splitByQuantity(
    totalFeeWon,
    items.map((item) => item.quantity),
  );

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.item.update({ where: { id: item.id }, data: { shippingFee: shares[index] } }),
    ),
  );

  revalidatePath("/items");
  revalidatePath("/");
}
