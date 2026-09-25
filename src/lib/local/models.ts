export type Item = {
  id: string; genre: string; character: string; series: string | null;
  itemType: string; detail: string; quantity: number; price: number;
  purchasedAt: Date | null; hasOverseasShipping: boolean; shippingFee: number;
  maker: string | null; organizer: string | null; isPhysical: boolean;
  expectedShipDate: Date | null; shipDateApprox: boolean; purchaseLink: string | null;
  memo: string | null; imageUrl: string | null; shippingGroupId: string | null;
  createdAt: Date; updatedAt: Date;
};
export type Sale = { id: string; itemId: string; quantitySold: number; saleAmount: number; saleDate: Date | null; createdAt: Date };
export type Named = { id: string; name: string; createdAt: Date };
export type Genre = Named & { order: number };
export type Character = Genre & { genreId: string };
export type Series = Named & { characterId: string };
export type Maker = Named & { genreId: string };
export type ShippingGroup = { id: string; label: string; createdAt: Date };
export type Event = Named & { date: Date | null };
export type Entry = {
  id: string; eventId: string; booth: string; label: string; type: "PICKUP" | "PURCHASE";
  checked: boolean; price: number; quantity: number; itemId: string | null; createdAt: Date;
};
export type Models = {
  item: Item; sale: Sale; genre: Genre; character: Character; series: Series;
  itemType: Genre; maker: Maker; organizer: Maker; shippingGroup: ShippingGroup;
  event: Event; eventChecklistItem: Entry;
};
export type Table = keyof Models;
export type Data = { [K in Table]: Models[K][] };
export const tables: Table[] = ["item", "sale", "genre", "character", "series", "itemType", "maker", "organizer", "shippingGroup", "event", "eventChecklistItem"];
export function emptyData(): Data {
  return { item: [], sale: [], genre: [], character: [], series: [], itemType: [], maker: [], organizer: [], shippingGroup: [], event: [], eventChecklistItem: [] };
}

// 백업 입력 검증과 새 레코드 기본값에 같은 필드 정의를 사용한다.
export const schema: Record<Table, Record<string, string>> = {
  item: { id: "string", genre: "string", character: "string", series: "string?", itemType: "string", detail: "string", quantity: "positive", price: "money", purchasedAt: "date?", hasOverseasShipping: "boolean", shippingFee: "money", maker: "string?", organizer: "string?", isPhysical: "boolean", expectedShipDate: "date?", shipDateApprox: "boolean", purchaseLink: "string?", memo: "string?", imageUrl: "string?", shippingGroupId: "string?", createdAt: "date", updatedAt: "date" },
  sale: { id: "string", itemId: "string", quantitySold: "positive", saleAmount: "money", saleDate: "date?", createdAt: "date" },
  genre: { id: "string", name: "string", order: "integer", createdAt: "date" },
  character: { id: "string", name: "string", order: "integer", genreId: "string", createdAt: "date" },
  series: { id: "string", name: "string", characterId: "string", createdAt: "date" },
  itemType: { id: "string", name: "string", order: "integer", createdAt: "date" },
  maker: { id: "string", name: "string", genreId: "string", createdAt: "date" },
  organizer: { id: "string", name: "string", genreId: "string", createdAt: "date" },
  shippingGroup: { id: "string", label: "string", createdAt: "date" },
  event: { id: "string", name: "string", date: "date?", createdAt: "date" },
  eventChecklistItem: { id: "string", eventId: "string", booth: "string", label: "string", type: "enum", checked: "boolean", price: "money", quantity: "positive", itemId: "string?", createdAt: "date" },
};

export function normalizeRow<K extends Table>(table: K, input: unknown): Models[K] {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("데이터 형식이 올바르지 않습니다.");
  const row = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, kind] of Object.entries(schema[table])) {
    let value = row[key];
    if (kind.endsWith("?") && value === null) { result[key] = null; continue; }
    if (kind.startsWith("date")) {
      if (!(value instanceof Date) && typeof value !== "string") throw new Error(`${table}.${key}: 날짜가 올바르지 않습니다.`);
      const date = new Date(value);
      value = date;
      if (!Number.isFinite(date.getTime())) throw new Error(`${table}.${key}: 날짜가 올바르지 않습니다.`);
    } else if (["money", "positive", "integer"].includes(kind)) {
      if (typeof value !== "number" && !(kind === "money" && typeof value === "string" && value.trim())) throw new Error(`${table}.${key}: 숫자가 필요합니다.`);
      const number = Number(value);
      value = number;
      if (!Number.isFinite(number) || number < 0 || number > Number.MAX_SAFE_INTEGER / 100 || (kind !== "money" && !Number.isInteger(number)) || (kind === "positive" && number < 1)) throw new Error(`${table}.${key}: 금액 또는 수량이 올바르지 않습니다.`);
    } else if (kind === "boolean") {
      if (typeof value !== "boolean") throw new Error(`${table}.${key}: 체크 값이 올바르지 않습니다.`);
    } else if (kind === "enum") {
      if (value !== "PICKUP" && value !== "PURCHASE") throw new Error("체크리스트 종류가 올바르지 않습니다.");
    } else if (typeof value !== "string" || (!kind.endsWith("?") && !value.trim())) throw new Error(`${table}.${key}: 내용을 입력해주세요.`);
    result[key] = value;
  }
  return result as Models[K];
}

export class ConflictError extends Error {}

export function validateData(data: Data) {
  for (const table of tables) {
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const row of data[table]) {
      normalizeRow(table, row);
      if (ids.has(row.id)) throw new Error("중복된 ID가 있습니다.");
      ids.add(row.id);
      if ("name" in row && table !== "event") {
        const key = JSON.stringify(["genreId" in row ? row.genreId : "characterId" in row ? row.characterId : "", row.name]);
        if (names.has(key)) throw new ConflictError("같은 이름이 이미 있습니다.");
        names.add(key);
      }
    }
  }
  const refs: [Table, string, Table][] = [["sale", "itemId", "item"], ["character", "genreId", "genre"], ["series", "characterId", "character"], ["maker", "genreId", "genre"], ["organizer", "genreId", "genre"], ["item", "shippingGroupId", "shippingGroup"], ["eventChecklistItem", "eventId", "event"], ["eventChecklistItem", "itemId", "item"]];
  for (const [table, field, parent] of refs) {
    const ids = new Set(data[parent].map(r => r.id));
    for (const row of data[table]) {
      const id = (row as unknown as Record<string, unknown>)[field];
      if (id !== null && !ids.has(String(id))) throw new Error(`${table}: 연결된 데이터를 찾을 수 없습니다.`);
    }
  }
  const sold = new Map<string, number>();
  for (const sale of data.sale) sold.set(sale.itemId, (sold.get(sale.itemId) ?? 0) + sale.quantitySold);
  for (const item of data.item) {
    if ((sold.get(item.id) ?? 0) > item.quantity) throw new Error("판매 수량이 구매 수량을 초과합니다.");
    if (item.purchaseLink && !/^https?:\/\//i.test(item.purchaseLink)) throw new Error("구매처 링크는 http 또는 https 주소여야 합니다.");
    if (item.imageUrl && !/^local-image:[a-zA-Z0-9-]+$/.test(item.imageUrl)) throw new Error("사진은 기기 저장소에 먼저 가져와야 합니다.");
  }
}
