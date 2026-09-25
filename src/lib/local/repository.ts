import { currentData, transactionData } from "./database";
import { schema, tables, normalizeRow, ConflictError, type Data, type Models, type Table } from "./models";

type Joined = {
  item: Models["item"] & { sales: Joined["sale"][]; shippingGroup: Joined["shippingGroup"] | null };
  sale: Models["sale"] & { item: Joined["item"] };
  genre: Models["genre"] & { characters: Joined["character"][]; makers: Joined["maker"][]; organizers: Joined["organizer"][] };
  character: Models["character"] & { genre: Joined["genre"]; series: Joined["series"][] };
  series: Models["series"] & { character: Joined["character"] };
  itemType: Models["itemType"];
  maker: Models["maker"] & { genre: Joined["genre"] };
  organizer: Models["organizer"] & { genre: Joined["genre"] };
  shippingGroup: Models["shippingGroup"] & { items: Joined["item"][] };
  event: Models["event"] & { entries: Joined["eventChecklistItem"][] };
  eventChecklistItem: Models["eventChecklistItem"] & { item: Joined["item"] | null };
};
export type Where = Record<string, unknown>;
type Order = Record<string, "asc" | "desc" | { sort: "asc" | "desc"; nulls: "first" | "last" }>;
type Query = { where?: Where; orderBy?: Order | Order[]; take?: number; select?: Record<string, boolean | Query>; include?: Record<string, boolean | Query> };
type Row = Record<string, unknown>;
// 이 앱에서 사용하는 관계만 정의한다. 모든 접근은 메모리의 로컬 스냅샷을 조회한다.
const relations: Partial<Record<Table, Record<string, [Table, string, string, boolean]>>> = {
  item: { sales: ["sale", "id", "itemId", true], shippingGroup: ["shippingGroup", "shippingGroupId", "id", false] },
  sale: { item: ["item", "itemId", "id", false] },
  genre: { characters: ["character", "id", "genreId", true], makers: ["maker", "id", "genreId", true], organizers: ["organizer", "id", "genreId", true] },
  character: { genre: ["genre", "genreId", "id", false], series: ["series", "id", "characterId", true] },
  series: { character: ["character", "characterId", "id", false] },
  maker: { genre: ["genre", "genreId", "id", false] }, organizer: { genre: ["genre", "genreId", "id", false] },
  shippingGroup: { items: ["item", "id", "shippingGroupId", true] },
  event: { entries: ["eventChecklistItem", "id", "eventId", true] },
  eventChecklistItem: { item: ["item", "itemId", "id", false] },
};
const indexes = new WeakMap<Data, Map<string, Map<unknown, Models[Table][]>>>();
function relatedRows(data: Data, table: Table, field: string, value: unknown) {
  let cache = indexes.get(data);
  if (!cache) { cache = new Map(); indexes.set(data, cache); }
  const key = `${table}:${field}`;
  let index = cache.get(key);
  if (!index) {
    index = new Map();
    for (const row of data[table]) {
      const fieldValue = (row as unknown as Row)[field];
      const bucket = index.get(fieldValue) ?? [];
      bucket.push(row); index.set(fieldValue, bucket);
    }
    cache.set(key, index);
  }
  return index.get(value) ?? [];
}
function scalar(value: unknown): string | number | boolean | null | undefined { return value instanceof Date ? value.getTime() : value as string | number | boolean | null | undefined; }
function matches(row: Row, where?: Where): boolean {
  return !where || Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    if (key === "OR") return (expected as Where[]).some(w => matches(row, w));
    if (key === "AND") return (expected as Where[]).every(w => matches(row, w));
    if (key === "genreId_name" || key === "characterId_name") return matches(row, expected as Where);
    const actual = row[key];
    if (expected === null || typeof expected !== "object" || expected instanceof Date) return scalar(actual) === scalar(expected);
    const condition = expected as Row;
    if ("some" in condition) return Array.isArray(actual) && actual.some(r => matches(r, condition.some as Where));
    if ("not" in condition && scalar(actual) === scalar(condition.not)) return false;
    if ("in" in condition && !(condition.in as unknown[]).some(v => scalar(v) === scalar(actual))) return false;
    for (const op of ["gte", "lt"] as const) if (op in condition) {
      const a = scalar(actual), b = scalar(condition[op]);
      if (a == null || b == null || (op === "gte" ? a < b : a >= b)) return false;
    }
    if (["not", "in", "gte", "lt"].some(op => op in condition)) return true;
    return !!actual && typeof actual === "object" && matches(actual as Row, condition);
  });
}
function sortRows<T extends Row>(rows: T[], order?: Order | Order[]): T[] {
  if (!order) return rows;
  const orders = Array.isArray(order) ? order : [order];
  return rows.sort((a, b) => {
    for (const entry of orders) for (const [field, direction] of Object.entries(entry)) {
      const av = scalar(a[field]), bv = scalar(b[field]);
      if (av === bv) continue;
      const sort = typeof direction === "string" ? direction : direction.sort;
      const nulls = typeof direction === "string" ? (sort === "asc" ? "last" : "first") : direction.nulls;
      if (av == null) return nulls === "first" ? -1 : 1;
      if (bv == null) return nulls === "first" ? 1 : -1;
      return (av < bv ? -1 : 1) * (sort === "asc" ? 1 : -1);
    }
    return 0;
  });
}
function join<K extends Table>(data: Data, table: K, raw: Models[K], query: Query = {}): Joined[K] {
  const row = { ...raw } as Row;
  for (const [key, [target, local, foreign, many]] of Object.entries(relations[table] ?? {}) as [string, [Table, string, string, boolean]][]) {
    Object.defineProperty(row, key, { enumerable: Boolean(query.include?.[key] ?? query.select?.[key]), get() {
      const option = query.include?.[key] ?? query.select?.[key];
      const nested = typeof option === "object" ? option : {};
      const result = relatedRows(data, target, foreign, row[local]).map(r => join(data, target, r, nested) as unknown as Row).filter(r => matches(r, nested.where));
      sortRows(result, nested.orderBy);
      return many ? result : result[0] ?? null;
    } });
  }
  return row as Joined[K];
}

export function createRepository(getData: () => Data, writable = false) {
  function model<K extends Table>(table: K) {
    const findMany = (query: Query = {}): Joined[K][] => {
      const data = getData();
      const rows = data[table].map(r => join(data, table, r, query)).filter(r => matches(r as unknown as Row, query.where));
      sortRows(rows as unknown as Row[], query.orderBy);
      return query.take === undefined ? rows : rows.slice(0, query.take);
    };
    const findUnique = (query: Query) => findMany(query)[0] ?? null;
    const findUniqueOrThrow = (query: Query) => { const row = findUnique(query); if (!row) throw new Error("항목을 찾을 수 없습니다."); return row; };
    function write() { if (!writable) throw new Error("조회 중에는 수정할 수 없습니다."); const data = getData(); indexes.delete(data); return data; }
    function checkUnique(row: Models[K]) {
      if (!("name" in row) || table === "event") return;
      const fields = ["name", ...(table === "series" ? ["characterId"] : ["character", "maker", "organizer"].includes(table) ? ["genreId"] : [])];
      if (getData()[table].some(other => other.id !== row.id && fields.every(k => (other as unknown as Row)[k] === (row as unknown as Row)[k]))) throw new ConflictError("같은 이름이 이미 있습니다.");
    }
    const create = ({ data: input }: { data: Record<string, unknown> }): Joined[K] => {
      const data = write();
      const defaults: Row = { id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), quantity: 1 };
      for (const [key, kind] of Object.entries(schema[table])) {
        if (kind.endsWith("?")) defaults[key] = null;
        else if (kind === "boolean") defaults[key] = false;
        else if (["money", "integer"].includes(kind)) defaults[key] = 0;
      }
      const row = normalizeRow(table, { ...defaults, ...input });
      if (data[table].some(r => r.id === row.id)) throw new ConflictError("같은 ID가 이미 있습니다.");
      checkUnique(row);
      data[table].push(row);
      return join(data, table, row);
    };
    const update = ({ where, data: input }: { where: Where; data: Record<string, unknown> }): Joined[K] => {
      const data = write(), old = findUniqueOrThrow({ where });
      const row = normalizeRow(table, { ...old, ...input, ...(table === "item" ? { updatedAt: new Date() } : {}) });
      checkUnique(row);
      data[table][data[table].findIndex(r => r.id === old.id)] = row;
      return join(data, table, row);
    };
    const remove = ({ where }: { where: Where }): Joined[K] => {
      const data = write(), old = findUniqueOrThrow({ where });
      data[table].splice(data[table].findIndex(r => r.id === old.id), 1);
      if (table === "item") { data.sale = data.sale.filter(r => r.itemId !== old.id); data.eventChecklistItem = data.eventChecklistItem.filter(r => r.itemId !== old.id); }
      if (table === "event") data.eventChecklistItem = data.eventChecklistItem.filter(r => r.eventId !== old.id);
      if (table === "shippingGroup") for (const item of data.item) if (item.shippingGroupId === old.id) item.shippingGroupId = null;
      if (table === "genre") {
        for (const child of [...data.character].filter(r => r.genreId === old.id)) model("character").delete({ where: { id: child.id } });
        data.maker = data.maker.filter(r => r.genreId !== old.id); data.organizer = data.organizer.filter(r => r.genreId !== old.id);
      }
      if (table === "character") data.series = data.series.filter(r => r.characterId !== old.id);
      return old;
    };
    return { findMany, findUnique, findUniqueOrThrow, create, update, delete: remove,
      upsert: ({ where, create: input, update: changes }: { where: Where; create: Row; update: Row }) => findUnique({ where }) ? update({ where, data: changes }) : create({ data: input }),
      updateMany: ({ where, data }: { where: Where; data: Row }) => { const rows = findMany({ where }); for (const row of rows) update({ where: { id: row.id }, data }); return { count: rows.length }; },
      createMany: ({ data }: { data: Row[] }) => { for (const row of data) create({ data: row }); return { count: data.length }; },
      deleteMany: (query: Query = {}) => { const rows = findMany(query); for (const row of rows) remove({ where: { id: row.id } }); return { count: rows.length }; },
    };
  }
  const repository = Object.fromEntries(tables.map(table => [table, model(table)])) as { [K in Table]: ReturnType<typeof model<K>> };
  return { ...repository, batch: <T>(operations: T[]) => operations };
}
export const db = createRepository(currentData);
export const transactionDb = createRepository(transactionData, true);
