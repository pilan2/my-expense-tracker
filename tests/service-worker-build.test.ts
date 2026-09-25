import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const run = promisify(execFile);

test("새 체크아웃처럼 public 폴더가 없어도 서비스 워커를 생성한다", async () => {
  const directory = await mkdtemp(join(tmpdir(), "expense-sw-build-"));
  try {
    await mkdir(join(directory, ".next/static/chunks"), { recursive: true });
    await mkdir(join(directory, "scripts"));
    await writeFile(join(directory, ".next/BUILD_ID"), "test-build\n");
    await writeFile(join(directory, ".next/static/chunks/app.js"), "");
    await writeFile(join(directory, ".next/static/chunks/app.js.map"), "");
    await copyFile("scripts/service-worker.js", join(directory, "scripts/service-worker.js"));
    await run(process.execPath, [resolve("scripts/build-service-worker.mjs")], { cwd: directory });
    const worker = await readFile(join(directory, "public/sw.js"), "utf8");
    assert.ok(worker.includes("expense-app-test-build"));
    assert.ok(worker.includes("/_next/static/chunks/app.js"));
    assert.ok(!worker.includes("app.js.map"));
    assert.ok(!worker.includes("__PRECACHE__"));
    // 기존 폴더가 있는 재빌드도 성공해야 한다.
    await run(process.execPath, [resolve("scripts/build-service-worker.mjs")], { cwd: directory });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
