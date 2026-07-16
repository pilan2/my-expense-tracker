"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function addGenre(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.genre.upsert({ where: { name }, create: { name }, update: {} });
  revalidatePath("/catalog");
}

export async function deleteGenre(id: string) {
  await requireAuth();
  await prisma.genre.delete({ where: { id } });
  revalidatePath("/catalog");
}

export async function addCharacter(genreId: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.character.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
  revalidatePath("/catalog");
}

export async function deleteCharacter(id: string) {
  await requireAuth();
  await prisma.character.delete({ where: { id } });
  revalidatePath("/catalog");
}
