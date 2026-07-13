"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

const WON_PER_MANWON = 10000;

// 입력 폼은 만원 단위(예: "1.5")를 받고, DB에는 원 단위 정수로 저장한다.
// 부동소수점 곱셈의 오차(2.54 * 10000 = 25399.999999999996 등)를 Math.round로 보정한다.
function manwonToWon(manwon: string): string {
  return String(Math.round(Number(manwon) * WON_PER_MANWON));
}

function parseItemForm(formData: FormData) {
  const isPhysical = formData.get("isPhysical") === "on";
  const expectedShipDateRaw = formData.get("expectedShipDate");
  const maker = String(formData.get("maker") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();

  return {
    genre: String(formData.get("genre") ?? "").trim(),
    character: String(formData.get("character") ?? "").trim(),
    series: series || null,
    itemType: String(formData.get("itemType") ?? "").trim(),
    detail: String(formData.get("detail") ?? "").trim(),
    quantity: Number(formData.get("quantity")),
    price: manwonToWon(String(formData.get("price") ?? "0")),
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
