import { defineConfig } from "@playwright/test";
import uiConfig from "./playwright.ui.config";

export default defineConfig({
  ...uiConfig,
  testDir: "./tests/demo",
  timeout: 120_000,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/demo", open: "never" }]],
  outputDir: "test-results/demo",
});
