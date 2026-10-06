import { test, expect, type Page } from "@playwright/test";
import { emptyData } from "../../src/lib/local/models";
import { createRepository } from "../../src/lib/local/repository";

const photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=";
function fixture() {
  const data = emptyData(), db = createRepository(() => data, true);
  const genre = db.genre.create({ data: { name: "장르" } });
  db.character.create({ data: { name: "캐릭터", genreId: genre.id } });
  db.itemType.create({ data: { name: "인형" } });
  const group = db.shippingGroup.create({ data: { id: "group-1", label: "함께 발송" } });
  db.item.create({ data: { id: "item-1", genre: "장르", character: "캐릭터", itemType: "인형", detail: "원래 품목", quantity: 3, price: 10000, hasOverseasShipping: true, purchasedAt: new Date(), expectedShipDate: new Date("2030-10-01"), shipDateApprox: true, shippingGroupId: group.id, imageUrl: "local-image:photo-1" } });
  const event = db.event.create({ data: { id: "event-1", name: "테스트 행사" } });
  db.eventChecklistItem.create({ data: { eventId: event.id, itemId: "item-1", booth: "A-01", label: "수령", type: "PICKUP" } });
  return { schemaVersion: 2, exportedAt: new Date().toISOString(), data, images: { "local-image:photo-1": photo } };
}
async function importFixture(page: Page) {
  await page.goto("/backup");
  await page.getByLabel("백업 파일").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture())) });
  await expect(page.getByText("품목 1개 · 판매 0개 · 행사 1개 · 체크리스트 1개 · 사진 1개")).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "불러오기 (기존 데이터 교체)" }).click();
  await expect(page.getByText("백업을 이 기기에 저장했습니다.")).toBeVisible();
  await expect(page.getByText("기기에 저장 · 오프라인 사용 준비 완료")).toBeVisible({ timeout: 30000 });
}

test("모바일: 전체 백업 복원 후 오프라인 조회·등록·판매·행사·통계·사진·재시작", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await importFixture(page);
  await context.setOffline(true);
  const dataRequests: string[] = [];
  page.on("request", request => { if (request.method() !== "GET" || request.url().includes("/api/")) dataRequests.push(request.url()); });
  await page.getByRole("link", { name: "🏠 대시보드" }).click();
  await page.getByRole("link", { name: "+ 품목 등록" }).click();
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("오프라인 새 품목");
  await page.locator('input[name="price"]').fill("2.5");
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.getByRole("link").filter({ hasText: "오프라인 새 품목" }).click();
  await page.locator('input[name="saleAmount"]').fill("3");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await expect(page.getByText("모두 판매되었습니다.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("모두 판매되었습니다.")).toBeVisible();
  await page.getByRole("link", { name: "행사", exact: true }).click();
  await page.getByRole("link").filter({ hasText: "테스트 행사" }).click();
  await page.getByRole("button", { name: "완료 체크" }).click();
  await expect(page.getByRole("button", { name: "완료 체크" })).toHaveText("☑");
  await page.getByRole("link", { name: "상세보기 →" }).click();
  await expect(page.locator('img').first()).toBeVisible();
  await expect.poll(() => page.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await page.getByRole("link", { name: "함께 발송 →" }).click();
  await expect(page.getByRole("heading", { name: "함께 발송" })).toBeVisible();
  await page.getByRole("link", { name: "🏠 대시보드" }).click();
  await expect(page.getByText("55,000원", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "통계 자세히 보기 →" }).click();
  await expect(page.getByRole("heading", { name: "전체 월별 추이" })).toBeVisible();
  await page.getByRole("link", { name: "백업", exact: true }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "다운로드", exact: true }).click();
  const download = await downloading;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const backup = JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.data.item).toHaveLength(2);
  expect(backup.data.sale).toHaveLength(1);
  expect(backup.data.eventChecklistItem[0].checked).toBe(true);
  expect(backup.images["local-image:photo-1"]).toBe(photo);
  expect(dataRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("손상된 백업 거절, 다른 탭 갱신, 기기별 데이터 분리", async ({ page, context, browser }) => {
  await importFixture(page);
  await page.getByLabel("백업 파일").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":2,"data":{},"images":{}}') });
  await expect(page.getByRole("alert").filter({ hasText: "목록이 없습니다" })).toContainText("목록이 없습니다");
  await expect(page.getByRole("button", { name: "불러오기 (기존 데이터 교체)" })).toBeDisabled();
  const other = await context.newPage();
  await other.goto("/items/item-1");
  await expect(other.getByText("원래 품목", { exact: true })).toBeVisible();
  await page.goto("/items/item-1?mode=edit");
  await page.getByLabel("물품 세부사항").fill("다른 탭에서도 갱신");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(other.getByText("다른 탭에서도 갱신", { exact: true })).toBeVisible();
  const isolated = await browser.newContext();
  const isolatedPage = await isolated.newPage();
  await isolatedPage.goto("http://localhost:3100/items");
  await expect(isolatedPage.getByText("등록된 품목이 없습니다.")).toBeVisible();
  await isolated.close();
});

test("카탈로그 이름 변경, 배송비 배분, 묶음 판매와 삭제 확인", async ({ page }) => {
  await importFixture(page);
  await page.goto("/catalog");
  await page.getByRole("button", { name: '"장르" 이름 수정', exact: true }).click();
  const rename = page.locator('form').filter({ has: page.getByRole("button", { name: "저장", exact: true }) });
  await rename.locator('input[name="name"]').fill("새 장르");
  await rename.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "새 장르" })).toBeVisible();
  await page.goto("/items/item-1");
  await expect(page.getByText("새 장르 · 캐릭터", { exact: true })).toBeVisible();
  await page.goto("/items/new");
  await page.getByRole("button", { name: "새 장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("묶음 품목");
  await page.locator('input[name="price"]').fill("2");
  await page.getByLabel("이후 배송비 계산 필요").check();
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "배송비 미정만 보기 →" }).click();
  await page.getByRole("button", { name: "배송비 나누기", exact: true }).click();
  for (const checkbox of await page.locator('input[name="itemIds"]').all()) await checkbox.check();
  await page.locator('input[name="totalShippingFee"]').fill("0.3");
  await page.getByRole("button", { name: "배송비 나누기", exact: true }).click();
  await expect(page.getByText("배송비 미정인 품목이 없습니다.")).toBeVisible();
  await page.getByRole("link", { name: "전체보기 →" }).click();
  await expect(page.getByText(/2,250원/)).toBeVisible();
  await expect(page.getByText(/750원/)).toBeVisible();
  await page.getByRole("button", { name: "묶음 판매", exact: true }).click();
  for (const checkbox of await page.locator('input[name="itemIds"]').all()) await checkbox.check();
  await page.getByRole("button", { name: "선택 완료 →" }).click();
  await page.locator('input[name="totalSaleAmount"]').fill("4");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await expect(page.getByText("판매 완료", { exact: true })).toHaveCount(2);
  await page.getByRole("link").filter({ hasText: "원래 품목" }).click();
  await page.getByRole("button", { name: "이 품목 삭제", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "확인", exact: true }).click();
  await expect(page.getByText("원래 품목", { exact: true })).toHaveCount(0);
  await page.goto("/events/event-1");
  await expect(page.getByText("아직 등록한 항목이 없습니다.")).toBeVisible();
});

test("행사만 복구: 모바일 기존 품목·사진 유지, 재선택 시 중복 방지", async ({ page }) => {
  await importFixture(page);
  const source = fixture();
  const file = {
    format: "expense-tracker-events", schemaVersion: 1,
    event: source.data.event.map(row => ({ ...row, id: "recovered-event", name: "복구된 행사" })),
    eventChecklistItem: source.data.eventChecklistItem.map(row => ({ ...row, id: "recovered-entry", eventId: "recovered-event" })),
  };
  const input = { name: "events.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(file)) };
  await page.getByLabel("행사 복구 파일").setInputFiles(input);
  await expect(page.getByText("추가할 행사 1개 · 체크리스트 1개 · 이미 있는 행사 0개")).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "행사만 추가", exact: true }).click();
  await expect(page.getByText("행사 1개 · 체크리스트 1개를 추가했습니다. 기존 행사 0개는 유지했습니다.")).toBeVisible();
  await page.getByLabel("행사 복구 파일").setInputFiles(input);
  await expect(page.getByText("추가할 행사 0개 · 체크리스트 0개 · 이미 있는 행사 1개")).toBeVisible();
  await expect(page.getByRole("button", { name: "행사만 추가", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "행사", exact: true }).click();
  await expect(page.getByText("복구된 행사", { exact: true })).toBeVisible();
  await expect(page.getByText("테스트 행사", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("link").filter({ hasText: "복구된 행사" }).click();
  await expect(page.getByRole("button", { name: "완료 체크" })).toBeVisible();
  await page.getByRole("link", { name: "상세보기 →" }).click();
  await expect.poll(() => page.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
});

test("전체 백업 왕복: 행사 2개·체크리스트 35개와 모든 데이터를 새 기기에 보존", async ({ page, browser }) => {
  const original = fixture();
  original.data.event.push({ ...original.data.event[0], id: "event-2", name: "두 번째 행사", date: new Date("2030-10-10T00:00:00.000Z") });
  const entry = original.data.eventChecklistItem[0];
  original.data.eventChecklistItem = Array.from({ length: 35 }, (_, index) => ({
    ...entry, id: `entry-${index}`, eventId: index < 20 ? "event-1" : "event-2",
    booth: `A-${index}`, label: `항목 ${index}`, checked: index % 2 === 0,
    type: index % 2 === 0 ? "PICKUP" : "PURCHASE", itemId: index % 2 === 0 ? "item-1" : null,
    price: 1000 + index, quantity: index + 1,
  }));
  const json = JSON.parse(JSON.stringify(original));
  async function restore(target: Page, value: unknown) {
    await target.goto("/backup");
    await target.getByLabel("백업 파일").setInputFiles({ name: "full.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(value)) });
    await expect(target.getByText("품목 1개 · 판매 0개 · 행사 2개 · 체크리스트 35개 · 사진 1개", { exact: true })).toBeVisible();
    target.once("dialog", dialog => dialog.accept());
    await target.getByRole("button", { name: "불러오기 (기존 데이터 교체)" }).click();
    await expect(target.getByText("백업을 이 기기에 저장했습니다.")).toBeVisible();
  }
  async function download(target: Page) {
    const pending = target.waitForEvent("download");
    await target.getByRole("button", { name: "다운로드", exact: true }).click();
    const stream = await (await pending).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    await expect(target.getByRole("status").filter({ hasText: "전체 백업 파일을 만들었습니다" })).toContainText("행사 2개 · 체크리스트 35개");
    return JSON.parse(Buffer.concat(chunks).toString());
  }
  await restore(page, original);
  await expect(page.getByText("현재 기기의 행사 2개 · 체크리스트 35개도 함께 백업합니다.")).toBeVisible();
  const exported = await download(page);
  expect(exported.data).toEqual(json.data);
  expect(exported.images).toEqual(json.images);
  const isolated = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  try {
    const target = await isolated.newPage();
    await restore(target, exported);
    await target.reload();
    await expect(target.getByText("현재 기기의 행사 2개 · 체크리스트 35개도 함께 백업합니다.")).toBeVisible();
    const roundTrip = await download(target);
    expect(roundTrip.data).toEqual(json.data);
    expect(roundTrip.images).toEqual(json.images);
    // 빈 배열과 구분하여, 목록 자체가 누락된 파일은 적용하지 않는다.
    for (const table of ["event", "eventChecklistItem"]) {
      const broken = structuredClone(exported);
      delete broken.data[table];
      await target.getByLabel("백업 파일").setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(broken)) });
      await expect(target.getByRole("alert").filter({ hasText: `백업에 ${table} 목록이 없습니다.` })).toBeVisible();
      await expect(target.getByRole("button", { name: "불러오기 (기존 데이터 교체)" })).toBeDisabled();
    }
  } finally { await isolated.close(); }
});

test("모바일 예산: 설정·후보 비교·초과 구매·편집·백업 복원", async ({ page, context, browser }) => {
  await importFixture(page);
  await page.goto("/budget");
  const month = await page.getByLabel("확인할 월").inputValue();
  await page.getByLabel("이 달부터 적용할 기본 월 예산 (만원)").fill("10");
  await page.getByRole("button", { name: "기본 예산 저장", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "기본 예산을 저장" })).toBeVisible();
  await expect(page.getByLabel("월별 예산 현황")).toContainText("70,000원 남음");
  await page.getByText("예산 설정", { exact: true }).click();
  await page.getByLabel("이 달만 사용할 예산 (만원)").fill("8");
  await page.getByRole("button", { name: "이 달 예산 저장", exact: true }).click();
  await expect(page.getByLabel("월별 예산 현황")).toContainText("50,000원 남음");
  await context.setOffline(true);
  await page.getByRole("button", { name: "후보 추가", exact: true }).click();
  await page.getByLabel("후보 이름", { exact: true }).fill("꼭 사고 싶은 인형");
  await page.getByLabel("예상 단가 (만원)").fill("6");
  await page.getByLabel("사고 싶은 이유").fill("오래 기다린 디자인");
  await page.getByLabel("우선순위").selectOption("1");
  await page.getByRole("button", { name: "후보 저장", exact: true }).click();
  await page.getByRole("checkbox", { name: "꼭 사고 싶은 인형" }).check();
  await expect(page.getByText("선택한 후보를 모두 사면 10,000원 초과")).toBeVisible();
  await expect(page.getByLabel("월별 예산 현황")).toContainText("50,000원 남음");
  await page.getByRole("link", { name: "구매하고 품목 등록" }).click();
  const candidateUrl = page.url();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("꼭 사고 싶은 인형");
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 초과");
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.goto(`/budget?month=${month}`);
  await expect(page.getByLabel("월별 예산 현황")).toContainText("10,000원 초과");
  await page.getByText("구매 완료한 후보 1개").click();
  await page.getByRole("link", { name: "등록한 품목 보기" }).click();
  const itemUrl = page.url();
  await page.goto(`${itemUrl}?mode=edit`);
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 초과");
  await page.locator('input[name="price"]').fill("4");
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 남음");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.goto(candidateUrl);
  await expect(page.getByText("이미 품목으로 등록한 구매 후보입니다.")).toBeVisible();
  await page.goto("/backup");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "다운로드", exact: true }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.schemaVersion).toBe(3);
  expect(exported.data.budgetRule).toHaveLength(1);
  expect(exported.data.monthlyBudget).toHaveLength(1);
  expect(exported.data.wish[0].status).toBe("purchased");
  expect(exported.data.item).toHaveLength(2);
  const isolated = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  try {
    const target = await isolated.newPage();
    await target.goto("/backup");
    await target.getByLabel("백업 파일").setInputFiles({ name: "budget-backup.json", mimeType: "application/json", buffer: Buffer.concat(chunks) });
    await expect(target.getByText("예산 설정 2개 · 구매 후보 1개", { exact: true })).toBeVisible();
    target.once("dialog", dialog => dialog.accept());
    await target.getByRole("button", { name: "불러오기 (기존 데이터 교체)" }).click();
    await expect(target.getByText("백업을 이 기기에 저장했습니다.")).toBeVisible();
    await target.goto(`/budget?month=${month}`);
    await expect(target.getByLabel("월별 예산 현황")).toContainText("10,000원 남음");
    await expect(target.getByText("구매 완료한 후보 1개")).toBeVisible();
  } finally { await isolated.close(); }
});
