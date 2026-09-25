import { localAction } from "@/lib/local/action";

import { redirect } from "@/lib/local/navigation";
import { transactionDb as db } from "@/lib/local/repository";
import { manwonToWon } from "@/lib/money";

export const createEvent = localAction(async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("행사 이름을 입력해주세요.");

  const dateRaw = formData.get("date");
  const event = await db.event.create({
    data: { name, date: dateRaw ? new Date(String(dateRaw)) : null },
  });

  redirect(`/events/${event.id}`);
});

export const updateEvent = localAction(async function updateEvent(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("행사 이름을 입력해주세요.");
  const dateRaw = formData.get("date");

  await db.event.update({
    where: { id },
    data: { name, date: dateRaw ? new Date(String(dateRaw)) : null },
  });
});

export const deleteEvent = localAction(async function deleteEvent(id: string) {
  await db.event.delete({ where: { id } });
  redirect("/events");
});

export const addChecklistItem = localAction(async function addChecklistItem(eventId: string, formData: FormData) {
  const booth = String(formData.get("booth") ?? "").trim();
  const type = String(formData.get("type") ?? "PICKUP") === "PURCHASE" ? "PURCHASE" : "PICKUP";
  if (!booth) throw new Error("부스를 입력해주세요.");

  // 품목을 여러 개 연결했으면(같은 부스에 여러 개를 한꺼번에 등록하는 경우가 많아서), 품목마다
  // 하나씩 항목을 만들고 각자의 이름/가격/수량을 그대로 가져온다. 이땐 직접 입력한 이름/가격/
  // 수량 칸은 무시한다(어느 품목에 적용할지 알 수 없으므로).
  const itemIds = [...new Set(formData.getAll("itemIds").map(String).filter(Boolean))];

  if (itemIds.length > 0) {
    const items = await db.item.findMany({ where: { id: { in: itemIds } } });
    if (items.length !== itemIds.length) throw new Error("선택한 품목을 찾을 수 없습니다.");

    await db.eventChecklistItem.createMany({
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

    await db.eventChecklistItem.create({
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

});

export const renameBooth = localAction(async function renameBooth(eventId: string, oldBooth: string, formData: FormData) {
  const newBooth = String(formData.get("booth") ?? "").trim();
  if (!newBooth || newBooth === oldBooth) return;

  await db.eventChecklistItem.updateMany({
    where: { eventId, booth: oldBooth },
    data: { booth: newBooth },
  });
});

export const deleteChecklistItem = localAction(async function deleteChecklistItem(id: string) {
  await db.eventChecklistItem.delete({ where: { id } });
});

export const toggleChecklistItem = localAction(async function toggleChecklistItem(id: string) {
  const entry = await db.eventChecklistItem.findUniqueOrThrow({ where: { id } });
  await db.eventChecklistItem.update({ where: { id }, data: { checked: !entry.checked } });
});
