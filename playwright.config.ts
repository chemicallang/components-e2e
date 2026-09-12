import { defineConfig } from "@playwright/test";

// Port for the static server that serves the compiled Chemical app output.
const PORT = Number(process.env.E2E_PORT || 4173);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Serial execution: tests share a page per file via beforeAll to avoid
  // creating a new browser context for every test.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
      },
    },
  ],
  webServer: {
    command: "node scripts/serve.mjs",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
