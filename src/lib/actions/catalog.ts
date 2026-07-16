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

export async function addSeries(characterId: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.series.upsert({
    where: { characterId_name: { characterId, name } },
    create: { name, characterId },
    update: {},
  });
  revalidatePath("/catalog");
}

export async function deleteSeries(id: string) {
  await requireAuth();
  await prisma.series.delete({ where: { id } });
  revalidatePath("/catalog");
}

export async function addItemType(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.itemType.upsert({ where: { name }, create: { name }, update: {} });
  revalidatePath("/catalog");
}

export async function deleteItemType(id: string) {
  await requireAuth();
  await prisma.itemType.delete({ where: { id } });
  revalidatePath("/catalog");
}

export async function addMaker(genreId: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.maker.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
  revalidatePath("/catalog");
}

export async function deleteMaker(id: string) {
  await requireAuth();
  await prisma.maker.delete({ where: { id } });
  revalidatePath("/catalog");
}

export async function addOrganizer(genreId: string, formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.organizer.upsert({
    where: { genreId_name: { genreId, name } },
    create: { name, genreId },
    update: {},
  });
  revalidatePath("/catalog");
}

export async function deleteOrganizer(id: string) {
  await requireAuth();
  await prisma.organizer.delete({ where: { id } });
  revalidatePath("/catalog");
}
