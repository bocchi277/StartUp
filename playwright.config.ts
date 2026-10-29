import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against the local Supabase stack (npm run db:start)
// and a production build of the app: npm run build && npm run test:e2e
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: "npx next start -p 3000",
    url: "http://localhost:3000/en",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
