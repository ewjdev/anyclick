import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/showcase/browser",
  fullyParallel: true,
  workers: 4,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    env: { SHOWCASE_ENABLED: "true" },
    command: "yarn workspace web-app exec next dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
