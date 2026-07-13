"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";
import { calcRemainingQuantity } from "@/lib/sales";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function parseItemForm(formData: FormData) {
  const isPhysical = formData.get("isPhysical") === "on";
  const expectedShipDateRaw = formData.get("expectedShipDate");
  const maker = String(formData.get("maker") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();

  if (!isPhysical && !expectedShipDateRaw) {
    throw new Error("현물로 보유 중이 아니면 예상 발송일을 입력해야 합니다.");
  }

  return {
    genre: String(formData.get("genre") ?? "").trim(),
    character: String(formData.get("character") ?? "").trim(),
    series: series || null,
    itemType: String(formData.get("itemType") ?? "").trim(),
    detail: String(formData.get("detail") ?? "").trim(),
    quantity: Number(formData.get("quantity")),
    price: manwonToWon(String(formData.get("price") ?? "0")),
    shippingFee: manwonToWon(String(formData.get("shippingFee") ?? "0")),
    hasOverseasShipping: formData.get("hasOverseasShipping") === "on",
    maker: maker || null,
    organizer: organizer || null,
    isPhysical,
    expectedShipDate:
      !isPhysical && expectedShipDateRaw ? new Date(String(expectedShipDateRaw)) : null,
  };
}

export async function createItem(formData: FormData) {
  await requireAuth();
  const data = parseItemForm(formData);
  await prisma.item.create({ data });
  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(id: string, formData: FormData) {
  await requireAuth();
  const data = parseItemForm(formData);

  const sales = await prisma.sale.findMany({ where: { itemId: id }, select: { quantitySold: true } });
  const soldQuantity = sales.reduce((sum, s) => sum + s.quantitySold, 0);
  if (calcRemainingQuantity(data.quantity, sales) < 0) {
    throw new Error(`이미 ${soldQuantity}개가 판매되어, 구매 수량을 그보다 적게 수정할 수 없습니다.`);
  }

  await prisma.item.update({ where: { id }, data });
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect("/items");
}

export async function deleteItem(id: string) {
  await requireAuth();
  await prisma.item.delete({ where: { id } });
  revalidatePath("/items");
  redirect("/items");
}
