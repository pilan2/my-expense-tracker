"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";
import { calcRemainingQuantity } from "@/lib/sales";
import { itemHref, safeRedirectTarget } from "@/lib/nav";
import { ensureInCatalog } from "@/lib/catalog";
import { uploadItemImage, deleteItemImage } from "@/lib/storage";

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
  const purchaseLink = String(formData.get("purchaseLink") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (!isPhysical && !expectedShipDateRaw) {
    throw new Error("현물로 보유 중이 아니면 예상 발송일을 입력해야 합니다.");
  }

  const shippingFee = manwonToWon(String(formData.get("shippingFee") ?? "0"));
  const purchasedAtRaw = formData.get("purchasedAt");

  return {
    genre: String(formData.get("genre") ?? "").trim(),
    character: String(formData.get("character") ?? "").trim(),
    series: series || null,
    itemType: String(formData.get("itemType") ?? "").trim(),
    detail: String(formData.get("detail") ?? "").trim(),
    quantity: Number(formData.get("quantity")),
    price: manwonToWon(String(formData.get("price") ?? "0")),
    // 구매일을 모르면 비워둘 수 있다 (날짜 기반 통계에서만 제외되고, 합계 통계에는 그대로 포함).
    purchasedAt: purchasedAtRaw ? new Date(String(purchasedAtRaw)) : null,
    shippingFee,
    // 배송비가 확정되어 입력됐다면, "이후 해외배송비 존재" 체크는 더 이상 의미가 없으니 자동 해제.
    hasOverseasShipping: Number(shippingFee) > 0 ? false : formData.get("hasOverseasShipping") === "on",
    maker: maker || null,
    organizer: organizer || null,
    isPhysical,
    expectedShipDate:
      !isPhysical && expectedShipDateRaw ? new Date(String(expectedShipDateRaw)) : null,
    purchaseLink: purchaseLink || null,
    memo: memo || null,
  };
}

export async function createItem(formData: FormData) {
  await requireAuth();
  const data = parseItemForm(formData);

  const imageFile = formData.get("image");
  const imageUrl = imageFile instanceof File && imageFile.size > 0 ? await uploadItemImage(imageFile) : null;

  await prisma.item.create({ data: { ...data, imageUrl } });
  await ensureInCatalog({
    genre: data.genre,
    character: data.character,
    series: data.series,
    itemType: data.itemType,
    maker: data.maker,
    organizer: data.organizer,
  });
  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(id: string, from: string, formData: FormData) {
  await requireAuth();
  const data = parseItemForm(formData);

  const sales = await prisma.sale.findMany({ where: { itemId: id }, select: { quantitySold: true } });
  const soldQuantity = sales.reduce((sum, s) => sum + s.quantitySold, 0);
  if (calcRemainingQuantity(data.quantity, sales) < 0) {
    throw new Error(`이미 ${soldQuantity}개가 판매되어, 구매 수량을 그보다 적게 수정할 수 없습니다.`);
  }

  // 새 사진을 올렸으면 교체(기존 파일은 스토리지에서 삭제), "사진 삭제"만 체크했으면 비우기,
  // 둘 다 아니면 기존 사진을 그대로 둔다.
  const existing = await prisma.item.findUniqueOrThrow({ where: { id }, select: { imageUrl: true } });
  const imageFile = formData.get("image");
  const removeImage = formData.get("removeImage") === "on";

  let imageUrl = existing.imageUrl;
  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadItemImage(imageFile);
    if (existing.imageUrl) await deleteItemImage(existing.imageUrl);
  } else if (removeImage && existing.imageUrl) {
    await deleteItemImage(existing.imageUrl);
    imageUrl = null;
  }

  await prisma.item.update({ where: { id }, data: { ...data, imageUrl } });
  await ensureInCatalog({
    genre: data.genre,
    character: data.character,
    series: data.series,
    itemType: data.itemType,
    maker: data.maker,
    organizer: data.organizer,
  });
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  // 저장 후에는 상위 목록이 아니라 이 품목의 보기 화면으로 돌아간다.
  redirect(itemHref(id, from));
}

export async function deleteItem(id: string, from: string) {
  await requireAuth();
  const item = await prisma.item.delete({ where: { id } });
  if (item.imageUrl) await deleteItemImage(item.imageUrl);
  revalidatePath("/items");
  redirect(safeRedirectTarget(from));
}
