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

export async function renameEvent(id: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("행사 이름을 입력해주세요.");

  await prisma.event.update({ where: { id }, data: { name } });
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
  const itemId = String(formData.get("itemId") ?? "").trim() || null;
  if (!booth) throw new Error("부스를 입력해주세요.");

  let label = String(formData.get("label") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  let price = priceRaw ? manwonToWon(priceRaw) : null;
  let quantity = quantityRaw ? Number(quantityRaw) : null;

  if (itemId && (!label || price === null || quantity === null)) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (item) {
      if (!label) label = `${item.genre} · ${item.character} · ${item.detail}`;
      if (price === null) price = item.price.toString();
      if (quantity === null) quantity = item.quantity;
    }
  }

  if (!label) throw new Error("무엇을 수령/구매할지 입력하거나 품목을 연결해주세요.");

  await prisma.eventChecklistItem.create({
    data: {
      eventId,
      booth,
      label,
      type,
      itemId,
      price: price ?? "0",
      quantity: quantity ?? 1,
    },
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
