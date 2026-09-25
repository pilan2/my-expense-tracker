import { emptyData, validateData, type Data } from "./models";

type Snapshot = { revision: number; data: Data };
let connection: Promise<IDBDatabase> | undefined;
let snapshot: Snapshot | undefined;
let draft: Data | undefined;
let stagedImages = new Map<string, Blob>();
let queue: Promise<unknown> = Promise.resolve();
let channel: BroadcastChannel | undefined;
const listeners = new Set<() => void>();
let version = 0;

export function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function getVersion() { return version; }
export function notifyChange() { version++; for (const listener of listeners) listener(); }
export function currentData() { if (!snapshot) throw new Error("기기 저장소를 불러오는 중입니다."); return snapshot.data; }
export function transactionData() { if (!draft) throw new Error("저장 작업 밖에서는 데이터를 수정할 수 없습니다."); return draft; }

function openDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("이 브라우저에서는 기기 저장소를 사용할 수 없습니다.")); return; }
    const request = indexedDB.open("my-expense-tracker", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("state");
      request.result.createObjectStore("images");
    };
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(new Error("다른 앱 탭을 닫고 다시 시도해주세요.")); };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = undefined; };
      resolve(db);
    };
  });
  return connection;
}

async function readSnapshot(): Promise<Snapshot> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly");
    const request = tx.objectStore("state").get("data");
    tx.oncomplete = () => resolve(request.result ?? { revision: 0, data: emptyData() });
    tx.onabort = () => reject(tx.error);
  });
}

export async function initializeDatabase() {
  if (!snapshot) { snapshot = await readSnapshot(); validateData(snapshot.data); }
  if (typeof window !== "undefined" && !channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("expense-tracker-updates");
    channel.onmessage = () => { void refreshDatabase().catch(() => notifyChange()); };
  }
}

export async function refreshDatabase() {
  return enqueue(async () => {
    const next = await readSnapshot();
    if (!snapshot || next.revision !== snapshot.revision) { validateData(next.data); snapshot = next; notifyChange(); }
  });
}

function enqueue<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(run, run);
  queue = result.catch(() => {});
  return result;
}

function imageIds(data: Data) { return new Set(data.item.flatMap(item => item.imageUrl ? [item.imageUrl] : [])); }

async function commit(previous: Snapshot, data: Data, images: Map<string, Blob>) {
  const db = await openDatabase();
  const next = { revision: previous.revision + 1, data };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["state", "images"], "readwrite");
    const state = tx.objectStore("state");
    let failure: Error | undefined;
    state.get("data").onsuccess = (event) => {
      const actual = (event.target as IDBRequest<Snapshot | undefined>).result;
      if ((actual?.revision ?? 0) !== previous.revision) {
        failure = new Error("다른 탭에서 데이터가 변경됐습니다. 화면을 새로고침한 뒤 다시 저장해주세요.");
        tx.abort(); return;
      }
      const photos = tx.objectStore("images");
      const referenced = imageIds(data);
      for (const [id, blob] of images) if (referenced.has(id)) photos.put(blob, id);
      for (const id of imageIds(previous.data)) if (!referenced.has(id)) photos.delete(id);
      state.put(next, "data");
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(failure ?? new Error(tx.error?.name === "QuotaExceededError" ? "기기 저장 공간이 부족해 저장하지 못했습니다. 기존 데이터는 유지됩니다." : "기기에 저장하지 못했습니다. 기존 데이터는 유지됩니다."));
  });
  snapshot = next;
  channel?.postMessage(next.revision);
  notifyChange();
}

// 모든 변경을 복사본에서 수행하고, 사진과 데이터가 함께 저장된 뒤 화면에 공개한다.
export function transaction<T>(run: () => Promise<T>): Promise<T> {
  return enqueue(async () => {
    const execute = async () => {
      const previous = await readSnapshot();
      validateData(previous.data);
      draft = structuredClone(previous.data);
      stagedImages = new Map();
      try {
        const result = await run();
        validateData(draft);
        await commit(previous, draft, stagedImages);
        return result;
      } finally { draft = undefined; stagedImages = new Map(); }
    };
    return typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("expense-tracker-write", execute)
      : execute();
  });
}

export function replaceData(data: Data) { transactionData(); draft = data; }
export function stageImage(blob: Blob, id = `local-image:${crypto.randomUUID()}`) {
  transactionData(); stagedImages.set(id, blob); return id;
}
export async function readImage(id: string): Promise<Blob> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readonly");
    const request = tx.objectStore("images").get(id);
    tx.oncomplete = () => request.result instanceof Blob ? resolve(request.result) : reject(new Error("저장된 사진을 찾을 수 없습니다."));
    tx.onabort = () => reject(tx.error);
  });
}

// 백업 도중 다른 탭에서 사진을 삭제해도 메타데이터와 사진이 같은 시점의 것이어야 한다.
export async function readBackupSnapshot(): Promise<{ data: Data; images: Map<string, Blob> }> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["state", "images"], "readonly");
    const state = tx.objectStore("state").get("data");
    const images = new Map<string, Blob>();
    let data = emptyData();
    let missing = false;
    state.onsuccess = () => {
      data = state.result?.data ?? emptyData();
      for (const id of imageIds(data)) {
        const photo = tx.objectStore("images").get(id);
        photo.onsuccess = () => { if (photo.result instanceof Blob) images.set(id, photo.result); else missing = true; };
      }
    };
    tx.oncomplete = () => missing ? reject(new Error("사진이 누락되어 백업을 만들 수 없습니다.")) : resolve({ data, images });
    tx.onabort = () => reject(tx.error);
  });
}
