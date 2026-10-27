import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/ui", open: "never" }]],
  outputDir: "test-results/ui",
  use: { baseURL: "http://127.0.0.1:3200", locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires", trace: "retain-on-failure" },
  projects: [
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    ...(process.env.TEST_FIREFOX === "1" ? [{ name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 900 } } }] : []),
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: "pnpm dev --hostname 127.0.0.1 --port 3200", url: "http://127.0.0.1:3200", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
