"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function parseItemForm(formData: FormData) {
  const isPhysical = formData.get("isPhysical") === "on";
  const expectedShipDateRaw = formData.get("expectedShipDate");
  const maker = String(formData.get("maker") ?? "").trim();
  const organizer = String(formData.get("organizer") ?? "").trim();

  return {
    genre: String(formData.get("genre") ?? "").trim(),
    character: String(formData.get("character") ?? "").trim(),
    itemType: String(formData.get("itemType") ?? "").trim(),
    quantity: Number(formData.get("quantity")),
    price: String(formData.get("price") ?? "0"),
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
