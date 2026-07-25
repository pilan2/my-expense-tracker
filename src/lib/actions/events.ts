"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { manwonToWon } from "@/lib/money";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function createEvent(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("행사 이름을 입력해주세요.");

  const dateRaw = formData.get("date");
  const event = await prisma.event.create({
    data: { name, date: dateRaw ? new Date(String(dateRaw)) : null },
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function updateEvent(id: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("행사 이름을 입력해주세요.");
  const dateRaw = formData.get("date");

  await prisma.event.update({
    where: { id },
    data: { name, date: dateRaw ? new Date(String(dateRaw)) : null },
  });
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function deleteEvent(id: string) {
  await requireAuth();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/events");
  redirect("/events");
}

export async function addChecklistItem(eventId: string, formData: FormData) {
  await requireAuth();
  const booth = String(formData.get("booth") ?? "").trim();
  const type = String(formData.get("type") ?? "PICKUP") === "PURCHASE" ? "PURCHASE" : "PICKUP";
  if (!booth) throw new Error("부스를 입력해주세요.");

  // 품목을 여러 개 연결했으면(같은 부스에 여러 개를 한꺼번에 등록하는 경우가 많아서), 품목마다
  // 하나씩 항목을 만들고 각자의 이름/가격/수량을 그대로 가져온다. 이땐 직접 입력한 이름/가격/
  // 수량 칸은 무시한다(어느 품목에 적용할지 알 수 없으므로).
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);

  if (itemIds.length > 0) {
    const items = await prisma.item.findMany({ where: { id: { in: itemIds } } });
    if (items.length === 0) throw new Error("선택한 품목을 찾을 수 없습니다.");

    await prisma.eventChecklistItem.createMany({
      data: items.map((item) => ({
        eventId,
        booth,
        type,
        itemId: item.id,
        label: `${item.genre} · ${item.character} · ${item.detail}`,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  } else {
    const label = String(formData.get("label") ?? "").trim();
    if (!label) throw new Error("무엇을 수령/구매할지 입력하거나 품목을 연결해주세요.");

    const priceRaw = String(formData.get("price") ?? "").trim();
    const quantityRaw = String(formData.get("quantity") ?? "").trim();

    await prisma.eventChecklistItem.create({
      data: {
        eventId,
        booth,
        label,
        type,
        itemId: null,
        price: priceRaw ? manwonToWon(priceRaw) : "0",
        quantity: quantityRaw ? Number(quantityRaw) : 1,
      },
    });
  }

  revalidatePath(`/events/${eventId}`);
}

export async function renameBooth(eventId: string, oldBooth: string, formData: FormData) {
  await requireAuth();
  const newBooth = String(formData.get("booth") ?? "").trim();
  if (!newBooth || newBooth === oldBooth) return;

  await prisma.eventChecklistItem.updateMany({
    where: { eventId, booth: oldBooth },
    data: { booth: newBooth },
  });
  revalidatePath(`/events/${eventId}`);
}

export async function deleteChecklistItem(id: string) {
  await requireAuth();
  const entry = await prisma.eventChecklistItem.delete({ where: { id } });
  revalidatePath(`/events/${entry.eventId}`);
}

export async function toggleChecklistItem(id: string) {
  await requireAuth();
  const entry = await prisma.eventChecklistItem.findUniqueOrThrow({ where: { id } });
  await prisma.eventChecklistItem.update({ where: { id }, data: { checked: !entry.checked } });
  revalidatePath(`/events/${entry.eventId}`);
}
