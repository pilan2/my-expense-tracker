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
const tab = (page: Page, name: string) => page.getByRole("navigation", { name: "주 메뉴" }).getByRole("link", { name, exact: true });
async function importFixture(page: Page) {
  await page.goto("/backup");
  await page.getByLabel("백업 파일").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(fixture())) });
  await expect(page.getByText("품목 1개 · 판매 0개 · 행사 1개 · 체크리스트 1개 · 사진 1개")).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "불러오기 (기존 데이터 교체)" }).click();
  await expect(page.getByText("백업을 이 기기에 저장했습니다.")).toBeVisible();
  // 오프라인 준비 완료는 화면에 표시하지 않으므로 서비스 워커가 활성화될 때까지 직접 기다린다.
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.ready).active), undefined, { timeout: 30000 });
}

test("모바일: 전체 백업 복원 후 오프라인 조회·등록·판매·행사·통계·사진·재시작", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await importFixture(page);
  await context.setOffline(true);
  const dataRequests: string[] = [];
  page.on("request", request => { if (request.method() !== "GET" || request.url().includes("/api/")) dataRequests.push(request.url()); });
  await tab(page, "홈").click();
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
  await page.getByText("+ 판매 기록 추가").click();
  await page.locator('input[name="saleAmount"]').fill("3");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await expect(page.getByText("모두 판매되었습니다.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("모두 판매되었습니다.")).toBeVisible();
  await tab(page, "행사").click();
  await page.getByRole("link").filter({ hasText: "테스트 행사" }).click();
  await page.getByRole("button", { name: "완료 체크" }).click();
  await expect(page.getByRole("button", { name: "완료 체크" })).toHaveText("☑");
  await page.getByRole("link", { name: "상세보기 →" }).click();
  await expect(page.locator('img').first()).toBeVisible();
  await expect.poll(() => page.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await page.getByRole("link", { name: "함께 발송 →" }).click();
  await expect(page.getByRole("heading", { name: "함께 발송" })).toBeVisible();
  await tab(page, "홈").click();
  await expect(page.getByText("55,000원", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "통계 자세히 보기 →" }).click();
  await expect(page.getByRole("heading", { name: "전체 월별 추이" })).toBeVisible();
  await tab(page, "더보기").click();
  await page.getByRole("link").filter({ hasText: "백업 및 기기 저장" }).click();
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
  await page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^배송비 미정 \\d") }).click();
  await page.getByRole("button", { name: "배송비 나누기", exact: true }).click();
  for (const checkbox of await page.locator('input[name="itemIds"]').all()) await checkbox.check();
  await page.locator('input[name="totalShippingFee"]').fill("0.3");
  await page.getByRole("button", { name: "배송비 나누기", exact: true }).click();
  await expect(page.getByText("배송비 미정인 품목이 없습니다.")).toBeVisible();
  await page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^전체 \\d") }).click();
  await expect(page.getByText(/2,250원/)).toBeVisible();
  await expect(page.getByText(/750원/)).toBeVisible();
  await page.getByRole("button", { name: "묶음 판매", exact: true }).click();
  for (const checkbox of await page.locator('input[name="itemIds"]').all()) await checkbox.check();
  await page.getByRole("button", { name: "선택 완료 →" }).click();
  await page.locator('input[name="totalSaleAmount"]').fill("4");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  // 다 팔린 품목은 "전체"에서 빠지고 "판매 완료" 필터에서만 보인다.
  await expect(page.getByText("조건에 맞는 품목이 없습니다.")).toBeVisible();
  await page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^판매 완료 \\d") }).click();
  await expect(page.locator("li").getByText("판매 완료", { exact: true })).toHaveCount(2);
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
  await tab(page, "행사").click();
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
  await expect(page.getByText(/행사 2개 · 체크리스트 35개/).first()).toBeVisible();
  const exported = await download(page);
  expect(exported.data).toEqual(json.data);
  expect(exported.images).toEqual(json.images);
  const isolated = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  try {
    const target = await isolated.newPage();
    await restore(target, exported);
    await target.reload();
    await expect(target.getByText(/행사 2개 · 체크리스트 35개/).first()).toBeVisible();
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

test("모바일 예산: 기본·이 달 예산 설정, 구매 전 예산 비교, 수정 반영, 백업 복원", async ({ page, browser }) => {
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
  await page.goto("/items/new");
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("꼭 사고 싶은 인형");
  await page.locator('input[name="price"]').fill("6");
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 초과");
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.goto(`/budget?month=${month}`);
  await expect(page.getByLabel("월별 예산 현황")).toContainText("10,000원 초과");
  await page.goto("/items");
  await page.getByRole("link").filter({ hasText: "꼭 사고 싶은 인형" }).click();
  await page.goto(`${page.url().split("?")[0]}?mode=edit`);
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 초과");
  await page.locator('input[name="price"]').fill("4");
  await expect(page.getByLabel("구매 후 예산")).toContainText("10,000원 남음");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page).not.toHaveURL(/mode=edit/);
  await page.goto("/backup");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "다운로드", exact: true }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.schemaVersion).toBe(3);
  expect(exported.data.budgetRule).toHaveLength(1);
  expect(exported.data.monthlyBudget).toHaveLength(1);
  expect(exported.data.item).toHaveLength(2);
  const isolated = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });
  try {
    const target = await isolated.newPage();
    await target.goto("/backup");
    await target.getByLabel("백업 파일").setInputFiles({ name: "budget-backup.json", mimeType: "application/json", buffer: Buffer.concat(chunks) });
    target.once("dialog", dialog => dialog.accept());
    await target.getByRole("button", { name: "불러오기 (기존 데이터 교체)" }).click();
    await expect(target.getByText("백업을 이 기기에 저장했습니다.")).toBeVisible();
    await target.goto(`/budget?month=${month}`);
    await expect(target.getByLabel("월별 예산 현황")).toContainText("10,000원 남음");
  } finally { await isolated.close(); }
});

test("새 품목 임시저장: 입력·사진 복원, 실패 시 보존, 성공과 새로 작성 시 삭제", async ({ page, context }) => {
  await importFixture(page);
  await page.goto("/items/new");
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("임시저장 테스트 인형");
  await page.getByLabel("메모 (선택)").fill("첫 줄\n아직 작성 중인 내용");
  await page.locator('input[name="price"]').fill("1.2");
  await page.getByRole("button", { name: "+", exact: true }).click();
  await page.getByRole("button", { name: "모름", exact: true }).click();
  await page.getByRole("button", { name: "월만 알 때", exact: true }).click();
  await page.locator('input[name="expectedShipMonth"]').fill("2030-10");
  await page.getByLabel("이후 배송비 계산 필요").check();
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 100; canvas.height = 100;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#ff9900"; ctx.fillRect(0, 0, 100, 100);
    return canvas.toDataURL("image/png");
  });
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({ name: "draft.png", mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") });
  await page.getByRole("button", { name: "다음: 자르기", exact: true }).click();
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "임시저장 완료" })).toBeVisible();
  await context.setOffline(true);
  await tab(page, "홈").click();
  await page.getByRole("link", { name: "+ 품목 등록", exact: true }).click();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("임시저장 테스트 인형");
  await page.reload();
  await expect(page.getByLabel("메모 (선택)")).toHaveValue("첫 줄\n아직 작성 중인 내용");
  await expect(page.locator('input[name="purchasedAt"]')).toHaveValue("");
  await expect(page.locator('input[name="expectedShipMonth"]')).toHaveValue("2030-10");
  await expect(page.locator('input[name="quantity"]')).toHaveValue("2");
  await expect(page.getByLabel("이후 배송비 계산 필요")).toBeChecked();
  await expect.poll(() => page.getByAltText("선택한 사진").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByLabel("구매처 링크 (선택)").fill("ftp://example.com");
  await expect(page.getByText("임시저장 완료", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "구매처 링크" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("임시저장 테스트 인형");
  await page.getByLabel("구매처 링크 (선택)").fill("");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.getByRole("link").filter({ hasText: "임시저장 테스트 인형" }).click();
  await expect.poll(() => page.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.goto("/items/new");
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("");
  await expect(page.getByAltText("선택한 사진")).toHaveCount(0);
  await page.getByLabel("물품 세부사항").fill("지울 임시 내용");
  await expect(page.getByText("임시저장 완료", { exact: true })).toBeVisible();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "임시저장 지우고 새로 작성" }).click();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("");
  await page.reload();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("");
});

test("목록 수령 확인: 상세 이동·외부 폼 제출 없이 저장, 실패 후 재시도와 재시작", async ({ page, context }) => {
  await importFixture(page);
  await context.setOffline(true);
  await page.goto("/items?pending=1");
  const receipt = page.getByRole("button", { name: "원래 품목 수령 확인", exact: true });
  await expect(receipt).toBeVisible();
  expect(await receipt.evaluate(button => button.closest("a") === null)).toBe(true);
  await page.getByRole("button", { name: "배송비 나누기", exact: true }).click();
  await expect(receipt).toHaveCount(0);
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(receipt).toBeVisible();
  await page.evaluate(() => {
    const original = IDBDatabase.prototype.transaction;
    IDBDatabase.prototype.transaction = function (...args: Parameters<typeof original>) {
      if (args[1] === "readwrite") {
        IDBDatabase.prototype.transaction = original;
        throw new DOMException("테스트 저장 실패", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await receipt.click();
  await expect(page.getByRole("alert").filter({ hasText: "테스트 저장 실패" })).toBeVisible();
  await expect(receipt).toBeEnabled();
  await expect(page).toHaveURL(/\/items\?pending=1$/);
  await receipt.click();
  await expect(receipt).toHaveCount(0);
  await expect(page).toHaveURL(/\/items\?pending=1$/);
  await expect(page.getByText("배송 완료 (발송일 2030년 10월)", { exact: true })).toBeVisible();
  await expect(page.locator("li").getByText("배송비 미정", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("배송 완료 (발송일 2030년 10월)", { exact: true })).toBeVisible();
  await expect(receipt).toHaveCount(0);
  await page.getByRole("link").filter({ hasText: "원래 품목" }).click();
  await expect(page).toHaveURL(/\/items\/item-1/);
  await expect.poll(() => page.locator('img').first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
});

test("같은 물품 추가 구매: 정보·사진 이어받기, 구매 건 비교, 목록 묶음과 묶음 해제", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await importFixture(page);
  await page.goto("/items/item-1?from=%2Fitems");
  await page.getByRole("link", { name: "+ 같은 물품 추가 구매" }).click();
  await expect(page.getByRole("heading", { name: "같은 물품 추가 구매" })).toBeVisible();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("원래 품목");
  await page.locator('input[name="price"]').fill("0.8");
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByText("현재 보고 있는 구매")).toBeVisible();
  await expect(page.getByText(/구매 2건 · 총 수량 4 · 평균 단가 9,500원 \(8,000원~10,000원\)/)).toBeVisible();
  await expect.poll(() => page.locator("img").first().evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);

  await page.goto("/items");
  await expect(page.getByText("같은 물품 2건")).toHaveCount(2);
  await page.goto(`/browse/${encodeURIComponent("장르")}/${encodeURIComponent("캐릭터")}`);
  const group = page.locator("details").filter({ hasText: "구매 2건" });
  await expect(group).toBeVisible();
  await group.locator("summary").click();
  await expect(group.getByRole("link")).toHaveCount(2);

  await page.goto("/items/item-1?from=%2Fitems");
  await page.getByRole("button", { name: "이 구매 건을 묶음에서 빼기" }).click();
  await page.getByRole("dialog").getByRole("button").last().click();
  await expect(page.getByText("다른 곳에서 같은 물품을 또 샀다면")).toBeVisible();
  await page.getByText("이미 등록한 품목과 같은 물품으로 연결").click();
  await page.getByRole("button", { name: "연결", exact: true }).click();
  await expect(page.getByText(/구매 2건 · 총 수량 4/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("하단 탭바: 탭 이동·현재 탭 표시·더보기 메뉴·하위 화면의 탭 유지", async ({ page }) => {
  await importFixture(page);
  await page.goto("/");
  await expect(tab(page, "홈")).toHaveAttribute("aria-current", "page");
  await tab(page, "품목").click();
  await expect(page.getByRole("heading", { name: "전체 품목", exact: true })).toBeVisible();
  await page.getByRole("link").filter({ hasText: "원래 품목" }).click();
  await expect(tab(page, "품목")).toHaveAttribute("aria-current", "page");
  await tab(page, "발송").click();
  await expect(page.getByRole("heading", { name: "발송 예정" })).toBeVisible();
  await tab(page, "더보기").click();
  for (const label of ["통계", "구매 내역", "판매 내역", "월별 예산", "장르/캐릭터 관리", "발송 그룹", "백업 및 기기 저장"]) {
    await expect(page.getByRole("link").filter({ hasText: label })).toBeVisible();
  }
  await page.getByRole("link").filter({ hasText: "통계" }).click();
  await expect(tab(page, "더보기")).toHaveAttribute("aria-current", "page");
  const box = await page.getByRole("navigation", { name: "주 메뉴" }).boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
});

test("홈: 예산 카드, 확인할 것 칩, 발송 예정·최근 구매 사진 카드, 누적 요약", async ({ page }) => {
  await importFixture(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "홈", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "전체 누적" })).toContainText("30,000원");
  await expect(page.getByRole("link", { name: "발송 일정 보기 →" })).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" }).first()).toContainText("2030년 10월");
  await page.getByRole("region", { name: "확인할 것" }).getByRole("link", { name: /배송비 미정/ }).click();
  await expect(page).toHaveURL(/\/items\?status=shipping-fee$/);
  await expect(page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: /^배송비 미정/ })).toHaveAttribute("aria-pressed", "true");
  await tab(page, "홈").click();
  await page.getByRole("region", { name: "전체 누적" }).getByRole("link", { name: "장르" }).click();
  await expect(page.getByRole("heading", { name: "장르", exact: true })).toBeVisible();
});

test("품목 검색·상태 필터: 즉시 거르기, 주소 유지, 상세에서 돌아오기, 이전 링크 호환", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/new");
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("두번째 키링");
  await page.locator('input[name="price"]').fill("1");
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByText("2개 품목")).toBeVisible();
  const search = page.getByRole("searchbox", { name: "품목 검색" });
  await search.fill("두번째 키 링");
  await expect(page.getByText("1개 품목")).toBeVisible();
  await expect(search).toBeFocused();
  await page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^현물 \\d") }).click();
  await expect(page).toHaveURL(/\/items\?q=.+&status=physical$/);
  await page.getByRole("link").filter({ hasText: "두번째 키링" }).click();
  await page.getByRole("link", { name: "← 뒤로가기" }).click();
  await expect(search).toHaveValue("두번째 키 링");
  await expect(page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^현물 \\d") })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^발송 대기 \\d") }).click();
  await expect(page.getByText("조건에 맞는 품목이 없습니다.")).toBeVisible();
  await page.goto("/items?pending=1");
  await expect(page.getByRole("group", { name: "상태 필터" }).getByRole("button", { name: new RegExp("^배송비 미정 \\d") })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("1개 품목")).toBeVisible();
});

test("품목 상세: 제목·상태 요약, 판매 입력 접기, 삭제는 맨 아래", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/item-1?from=%2Fitems");
  await expect(page.getByRole("heading", { name: "원래 품목", level: 1 })).toBeVisible();
  await expect(page.getByText("발송예정 2030년 10월")).toBeVisible();
  await expect(page.getByText("이후 계산 필요")).toBeVisible();
  await expect(page.getByText("30,000원", { exact: true })).toBeVisible();
  const saleAmount = page.locator('input[name="saleAmount"]');
  await expect(saleAmount).toBeHidden();
  await page.getByText("+ 판매 기록 추가").click();
  await saleAmount.fill("1.2");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await expect(page.getByText(/1개 · 12,000원/)).toBeVisible();
  await expect(page.getByText(/손익 \+2,000원/).first()).toBeVisible();
  const order = await page.evaluate(() => {
    const top = (text: string) => [...document.querySelectorAll("button, h2")].find(el => el.textContent?.trim() === text)!.getBoundingClientRect().top;
    return { sales: top("판매 관리"), same: top("같은 물품 구매 기록"), remove: top("이 품목 삭제") };
  });
  expect(order.sales).toBeLessThan(order.same);
  expect(order.same).toBeLessThan(order.remove);
  // 맨 아래 삭제 버튼이 하단 탭바에 가리지 않아야 한다.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.getByRole("button", { name: "이 품목 삭제" }).evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === button;
  })).toBe(true);
  await page.goto("/items/item-1?from=%2Fitems&mode=edit");
  await expect(page.getByRole("heading", { name: "품목 수정" })).toBeVisible();
  await expect(page.getByRole("button", { name: "이 품목 삭제" })).toBeVisible();
  await expect(page.getByText("판매 관리")).toHaveCount(0);
});

test("입력 폼: 만원 입력의 원 환산 표시, 구역 제목, 저장 전 합계", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/new");
  for (const title of ["물품", "구매", "배송", "메모"]) await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await page.locator('input[name="price"]').fill("1.5");
  await expect(page.getByText("= 15,000원", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+", exact: true }).click();
  await page.locator('input[name="shippingFee"]').fill("0.3");
  await expect(page.getByText("= 3,000원", { exact: true })).toBeVisible();
  await expect(page.getByText("합계 15,000원 × 2 + 배송비 3,000원 = 33,000원")).toBeVisible();
  await page.goto("/items/item-1");
  await page.getByText("+ 판매 기록 추가").click();
  await page.locator('input[name="saleAmount"]').fill("2");
  await expect(page.getByText("= 20,000원", { exact: true })).toBeVisible();
});

test.describe("한국 시간 새벽", () => {
  test.use({ timezoneId: "Asia/Seoul" });
  test("판매일 기본값은 현지 날짜, 판매 금액은 1원 단위까지 입력", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-21T00:30:00+09:00"));
    await importFixture(page);
    await page.goto("/items/item-1");
    await page.getByText("+ 판매 기록 추가").click();
    await expect(page.locator('input[name="saleDate"]')).toHaveValue("2026-11-21");
    await page.locator('input[name="saleAmount"]').fill("0.1234");
    await page.getByRole("button", { name: "판매 등록", exact: true }).click();
    await expect(page.getByText("2026. 11. 21. · 1개 · 1,234원")).toBeVisible();
    await page.goto("/items/item-1");
    await page.getByRole("link", { name: "+ 같은 물품 추가 구매" }).click();
    await page.locator('input[name="price"]').fill("1");
    await page.getByLabel("현물로 보유 중").check();
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.getByText("현재 보고 있는 구매")).toBeVisible();
    const newId = new URL(page.url()).pathname.split("/").pop();
    await page.goto(`/items/bulk-sale?itemIds=item-1&itemIds=${newId}`);
    await expect(page.locator('input[name="saleDate"]')).toHaveValue("2026-11-21");
  });
});

test("사진 저장: 큰 사진은 긴 변 1600px 이하 JPEG로 줄여서 저장", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/item-1?mode=edit");
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 4000; canvas.height = 3000;
    const ctx = canvas.getContext("2d")!;
    for (let i = 0; i < 400; i++) { ctx.fillStyle = `hsl(${i}, 70%, 50%)`; ctx.fillRect((i * 97) % 4000, (i * 53) % 3000, 200, 200); }
    return canvas.toDataURL("image/png");
  });
  await page.getByLabel("사진 선택", { exact: true }).setInputFiles({ name: "big.png", mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1], "base64") });
  await page.getByRole("button", { name: "다음: 자르기", exact: true }).click();
  await page.getByRole("button", { name: "적용", exact: true }).click();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "원래 품목", level: 1 })).toBeVisible();
  const size = await page.locator("img").first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const blob = await (await fetch(img.src)).blob();
    return { width: img.naturalWidth, height: img.naturalHeight, type: blob.type, bytes: blob.size };
  });
  expect(Math.max(size.width, size.height)).toBe(1600);
  expect(size.type).toBe("image/jpeg");
  expect(size.bytes).toBeLessThan(1_000_000);
});

test("백업 알림: 백업 전에는 홈에 표시, 다운로드하면 사라지고 백업 화면에 마지막 백업 표시", async ({ page }) => {
  await importFixture(page);
  await page.goto("/");
  const reminder = page.getByRole("status").filter({ hasText: "아직 백업한 적이 없어요" });
  await expect(reminder).toBeVisible();
  await reminder.click();
  await expect(page.getByRole("list", { name: "백업 상태" })).toContainText("마지막 백업: 아직 없음");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "다운로드", exact: true }).click();
  await downloading;
  await expect(page.getByRole("list", { name: "백업 상태" })).toContainText("(오늘) · 이후 변경 없음");
  await tab(page, "홈").click();
  await expect(page.getByRole("heading", { name: "홈", exact: true })).toBeVisible();
  await expect(page.getByText("아직 백업한 적이 없어요")).toHaveCount(0);
});

test("행사 체크리스트: 수령 체크 시 품목 수령 확인, 현장 구매 항목을 품목으로 등록·연결", async ({ page }) => {
  await importFixture(page);
  await page.goto("/events/event-1");
  page.once("dialog", (dialog) => { expect(dialog.message()).toContain("수령 확인할까요?"); void dialog.accept(); });
  await page.getByRole("button", { name: "완료 체크" }).click();
  await expect(page.getByRole("button", { name: "완료 체크" })).toHaveText("☑");
  await page.goto("/items/item-1");
  await expect(page.getByText("배송 완료 (발송일 2030년 10월)")).toBeVisible();

  await page.goto("/events/event-1");
  await page.getByPlaceholder("부스 (예: A-12)").fill("B-07");
  await page.locator('select[name="type"]').selectOption("PURCHASE");
  await page.getByPlaceholder("품목 이름 (품목을 연결하지 않을 때만 직접 입력)").fill("현장 한정 엽서");
  await page.locator('input[name="price"]').fill("0.5");
  await page.getByRole("button", { name: "체크리스트에 추가" }).click();
  await page.getByRole("link", { name: "품목으로 등록 →" }).click();
  await expect(page.getByLabel("물품 세부사항")).toHaveValue("현장 한정 엽서");
  await expect(page.locator('input[name="price"]')).toHaveValue("0.5");
  await expect(page.getByLabel("현물로 보유 중")).toBeChecked();
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "캐릭터", exact: true }).click();
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page.getByRole("heading", { name: "테스트 행사" })).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: "장르 · 캐릭터 · 현장 한정 엽서" })).toBeVisible();
  await expect(page.getByRole("link", { name: "품목으로 등록 →" })).toHaveCount(0);
});

test("판매 기록 수정: 수량·금액·날짜를 고치고 잔여 수량과 손익에 반영", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/item-1?from=%2Fitems");
  await page.getByText("+ 판매 기록 추가").click();
  await page.locator('input[name="saleAmount"]').fill("1.5");
  await page.locator('input[name="saleDate"]').fill("2026-11-01");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await page.getByRole("button", { name: "2026. 11. 1. · 1개 · 15,000원 수정" }).click();
  const form = page.getByRole("form", { name: "판매 기록 수정" });
  await expect(form.getByText("판매 수량 (최대 3개)")).toBeVisible();
  await form.locator('input[name="quantitySold"]').fill("2");
  await form.locator('input[name="saleAmount"]').fill("2.6");
  await form.locator('input[name="saleDate"]').fill("2026-11-05");
  await form.getByRole("button", { name: "수정 저장" }).click();
  await expect(page.getByText("2026. 11. 5. · 2개 · 26,000원")).toBeVisible();
  await expect(page.getByText("잔여 1개")).toBeVisible();
  await expect(page.getByText(/손익 \+6,000원/).first()).toBeVisible();
});

test("품목 사진 그리드: 보기 전환, 상태 칩, 상세에서 돌아와도 그리드 유지, 선택 모드는 목록", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items");
  await page.getByRole("button", { name: "사진 그리드 보기" }).click();
  await expect(page).toHaveURL(/\/items\?view=grid$/);
  const card = page.getByRole("link").filter({ hasText: "원래 품목" });
  await expect(card).toContainText("2030년 10월");
  await expect(card).toContainText("30,000원");
  await card.click();
  await page.getByRole("link", { name: "← 뒤로가기" }).click();
  await expect(page.getByRole("button", { name: "사진 그리드 보기" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "묶음 판매", exact: true }).click();
  await expect(page.locator('input[name="itemIds"]')).toHaveCount(1);
});

test("장르 화면: 캐릭터 고르지 않아도 전체 품목, 캐릭터 필터, 다 팔린 품목은 사진 삭제 후 숨김", async ({ page }) => {
  await importFixture(page);
  await page.goto("/items/new");
  await page.getByRole("button", { name: "장르", exact: true }).click();
  await page.getByRole("button", { name: "+ 직접 입력" }).nth(1).click();
  await page.getByPlaceholder("캐릭터 직접 입력").fill("다른 캐릭터");
  await page.getByRole("button", { name: "인형", exact: true }).click();
  await page.getByLabel("물품 세부사항").fill("다른 캐릭터 인형");
  await page.locator('input[name="price"]').fill("1");
  await page.getByLabel("현물로 보유 중").check();
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.goto(`/browse/${encodeURIComponent("장르")}`);
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" })).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: "다른 캐릭터 인형" })).toBeVisible();
  await page.getByRole("navigation", { name: "캐릭터 필터" }).getByRole("link", { name: /^다른 캐릭터/ }).click();
  await expect(page).toHaveURL(/character=/);
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" })).toHaveCount(0);
  await page.goto(`/browse/${encodeURIComponent("장르")}/${encodeURIComponent("캐릭터")}`);
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" })).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: "다른 캐릭터 인형" })).toHaveCount(0);

  await page.goto("/items/item-1");
  await expect(page.locator("img").first()).toBeVisible();
  await page.getByText("+ 판매 기록 추가").click();
  await page.locator('input[name="quantitySold"]').fill("3");
  await page.locator('input[name="saleAmount"]').fill("4");
  await page.getByRole("button", { name: "판매 등록", exact: true }).click();
  await expect(page.getByText("모두 판매되었습니다.")).toBeVisible();
  await expect(page.locator("img")).toHaveCount(0);
  await page.goto(`/browse/${encodeURIComponent("장르")}`);
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" })).toHaveCount(0);
  await page.goto("/items");
  await expect(page.getByRole("link").filter({ hasText: "원래 품목" })).toHaveCount(0);
});
