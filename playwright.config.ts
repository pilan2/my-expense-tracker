import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: { ...devices["Pixel 7"], baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: { command: "npm run start -- --port 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 30000 },
});
