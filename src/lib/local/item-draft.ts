import { openDatabase } from "./database";

export type ItemDraftValues = {
  genre: string; character: string; series: string; itemType: string; detail: string;
  quantity: number; price: string; purchasedAt: string; shippingFee: string;
  hasOverseasShipping: boolean; maker: string; organizer: string; isPhysical: boolean;
  expectedShipDate: string; expectedShipMonth: string; shipDateApprox: boolean;
  purchaseLink: string; memo: string;
};
export type ItemDraft = { revision: number; values: ItemDraftValues | null; image: Blob | null };
export function itemDraftKey(wishId?: string) { return wishId ? `item-draft:wish:${wishId}` : "item-draft:new"; }

const pendingWrites = new Map<string, Promise<unknown>>();
export function queueItemDraftWrite<T>(key: string, write: () => Promise<T>): Promise<T> {
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(write);
  pendingWrites.set(key, next);
  void next.finally(() => { if (pendingWrites.get(key) === next) pendingWrites.delete(key); }).catch(() => {});
  return next;
}

export async function readItemDraft(key: string): Promise<ItemDraft> {
  await pendingWrites.get(key)?.catch(() => {});
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readonly"), state = tx.objectStore("state");
    const record = state.get(key), image = state.get(`${key}:image`);
    tx.oncomplete = () => resolve({ revision: record.result?.revision ?? 0, values: record.result?.values ?? null, image: image.result ?? null });
    tx.onabort = () => reject(new Error("임시저장을 읽지 못했습니다. 다시 시도해주세요."));
  });
}

// 일반 앱 데이터와 별도 키에 저장한다. 사진은 바뀔 때만 쓰고, 다른 탭의 새 입력을 덮어쓰지 않는다.
export async function writeItemDraft(key: string, revision: number, values: ItemDraftValues | null, image?: Blob | null): Promise<number> {
  if (image && (!/^image\/(jpeg|png|webp|gif)$/.test(image.type) || image.size > 8 * 1024 * 1024)) throw new Error("임시저장 사진은 8MB 이하의 JPEG, PNG, WebP, GIF만 지원합니다.");
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite"), state = tx.objectStore("state");
    let failure: Error | undefined;
    state.get(key).onsuccess = event => {
      const previous = (event.target as IDBRequest).result;
      if ((previous?.revision ?? 0) !== revision) {
        failure = new Error("다른 탭에서 이 임시저장을 변경했습니다. 현재 입력을 복사해 두고 화면을 다시 열어주세요.");
        tx.abort(); return;
      }
      // 삭제 후에도 revision을 남겨 오래 열린 탭이 임시저장을 되살리지 못하게 한다.
      state.put({ revision: revision + 1, values }, key);
      if (values === null || image === null) state.delete(`${key}:image`);
      else if (image !== undefined) state.put(image, `${key}:image`);
    };
    tx.oncomplete = () => resolve(revision + 1);
    tx.onabort = () => reject(failure ?? new Error("임시저장에 실패했습니다. 저장 공간과 브라우저 설정을 확인해주세요. 현재 화면의 입력은 유지됩니다."));
  });
}
