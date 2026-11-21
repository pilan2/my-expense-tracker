"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ItemForm } from "./item-form";
import { itemDraftKey, readItemDraft, writeItemDraft, queueItemDraftWrite, type ItemDraft, type ItemDraftValues } from "@/lib/local/item-draft";

type Props = ComponentProps<typeof ItemForm>;

export function NewItemDraftForm(props: Props) {
  const key = itemDraftKey(props.wishId, props.sameAsItemId, props.checklistEntryId);
  const [loaded, setLoaded] = useState<ItemDraft>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void readItemDraft(key).then(value => { if (!cancelled) setLoaded(value); }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "임시저장을 읽지 못했습니다.");
    });
    return () => { cancelled = true; };
  }, [key, attempt]);
  if (error) return <div role="alert"><p>{error}</p><button className="mt-2 underline" onClick={() => { setError(""); setAttempt(value => value + 1); }}>다시 읽기</button></div>;
  if (!loaded) return <p role="status">작성 중인 내용을 확인하는 중…</p>;
  return <DraftEditor key={`${key}:${attempt}`} {...props} draftKey={key} loaded={loaded} reset={() => { setLoaded(undefined); setAttempt(value => value + 1); }} />;
}

function DraftEditor({ draftKey, loaded, reset, ...props }: Props & { draftKey: string; loaded: ItemDraft; reset: () => void }) {
  const revision = useRef(loaded.revision);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const suspended = useRef(false);
  const generation = useRef(0);
  const [initialImage] = useState(() => loaded.image ? new File([loaded.image], "draft-photo", { type: loaded.image.type }) : null);
  const savedImage = useRef<File | null>(initialImage);
  const previous = useRef<{ json: string; image: File | null } | null>(null);
  const [status, setStatus] = useState(loaded.values ? "임시저장한 내용을 불러왔어요." : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function save(values: ItemDraftValues, image: File | null) {
    if (suspended.current) return;
    const json = JSON.stringify(values), prior = previous.current;
    previous.current = { json, image };
    if (!prior || (prior.json === json && prior.image === image)) return;
    const sequence = ++generation.current;
    setStatus("임시저장 중…"); setError("");
    const work = queueItemDraftWrite(draftKey, async () => {
      revision.current = await writeItemDraft(draftKey, revision.current, values, savedImage.current !== image ? image : undefined);
      savedImage.current = image;
    });
    pending.current = work;
    void work.then(() => { if (sequence === generation.current) setStatus("임시저장 완료"); }).catch(cause => {
      if (sequence === generation.current) { setStatus(""); setError(cause instanceof Error ? cause.message : "임시저장에 실패했습니다."); }
    });
  }

  async function submit(form: FormData) {
    suspended.current = true; setBusy(true);
    try {
      await pending.current;
      form.set("itemDraftRevision", String(revision.current));
      await props.action(form);
    } catch (cause) {
      suspended.current = false;
      throw cause;
    } finally { setBusy(false); }
  }
  async function discard() {
    if (!window.confirm("작성 중인 내용과 적용한 사진을 지우고 새로 작성할까요?")) return;
    suspended.current = true; setBusy(true);
    try {
      await pending.current;
      revision.current = await queueItemDraftWrite(draftKey, () => writeItemDraft(draftKey, revision.current, null));
      reset();
    } catch (cause) {
      suspended.current = false;
      setError(cause instanceof Error ? cause.message : "임시저장을 지우지 못했습니다.");
    } finally { setBusy(false); }
  }
  return <>
    <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-2 text-sm text-muted">
      {status ? <p role="status">{status}</p> : <span />}
      {error && <p role="alert" className="text-loss">{error}</p>}
      {(status || loaded.values) && <button type="button" disabled={busy} onClick={() => void discard()} className="min-h-11 underline disabled:opacity-40">임시저장 지우고 새로 작성</button>}
    </div>
    <fieldset disabled={busy} className="min-w-0">
      <ItemForm {...props} defaultValues={loaded.values ? { ...props.defaultValues, ...loaded.values } : props.defaultValues} initialImage={initialImage} onDraftChange={save} action={submit} />
    </fieldset>
  </>;
}
