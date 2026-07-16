"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

type BackupSale = {
  id: string;
  quantitySold: number;
  saleAmount: string | number;
  saleDate: string | null;
  createdAt: string;
};

type BackupItem = {
  id: string;
  genre: string;
  character: string;
  series: string | null;
  itemType: string;
  detail: string;
  quantity: number;
  price: string | number;
  purchasedAt: string | null;
  hasOverseasShipping: boolean;
  shippingFee: string | number;
  maker: string | null;
  organizer: string | null;
  isPhysical: boolean;
  expectedShipDate: string | null;
  createdAt: string;
  updatedAt: string;
  sales: BackupSale[];
};

// /api/backup에서 내려받은 JSON으로 전체 데이터(품목+판매 이력)를 완전히 교체한다.
export async function restoreBackup(formData: FormData) {
  await requireAuth();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("백업 파일을 선택해주세요.");
  }

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("올바른 JSON 파일이 아닙니다.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { items?: unknown }).items)
  ) {
    throw new Error("백업 파일 형식이 올바르지 않습니다.");
  }

  const items = (parsed as { items: BackupItem[] }).items;

  await prisma.$transaction(async (tx) => {
    // Sale은 Item에 onDelete: Cascade로 걸려있어 품목 삭제 시 함께 지워진다.
    await tx.item.deleteMany({});

    for (const item of items) {
      await tx.item.create({
        data: {
          id: item.id,
          genre: item.genre,
          character: item.character,
          series: item.series,
          itemType: item.itemType,
          detail: item.detail,
          quantity: item.quantity,
          price: item.price,
          purchasedAt: item.purchasedAt ? new Date(item.purchasedAt) : null,
          hasOverseasShipping: item.hasOverseasShipping,
          shippingFee: item.shippingFee,
          maker: item.maker,
          organizer: item.organizer,
          isPhysical: item.isPhysical,
          expectedShipDate: item.expectedShipDate ? new Date(item.expectedShipDate) : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });

      for (const sale of item.sales ?? []) {
        await tx.sale.create({
          data: {
            id: sale.id,
            itemId: item.id,
            quantitySold: sale.quantitySold,
            saleAmount: sale.saleAmount,
            saleDate: sale.saleDate ? new Date(sale.saleDate) : null,
            createdAt: new Date(sale.createdAt),
          },
        });
      }
    }
  });

  revalidatePath("/", "layout");
  redirect("/");
}
