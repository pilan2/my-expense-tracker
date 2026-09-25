import { readdir, readFile, writeFile } from "node:fs/promises";
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(e => e.isDirectory() ? files(`${dir}/${e.name}`) : `${dir}/${e.name}`))).flat();
}
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const assets = (await files(".next/static")).filter(p => /\.(js|css|woff2?)$/.test(p)).map(p => p.replace(".next/", "/_next/"));
const precache = ["/", "/manifest.webmanifest", "/favicon.ico", "/icons/192", "/icons/512", ...assets];
const template = await readFile("scripts/service-worker.js", "utf8");
await writeFile("public/sw.js", template.replace("__CACHE_NAME__", `expense-app-${buildId}`).replace("__PRECACHE__", JSON.stringify(precache)));
