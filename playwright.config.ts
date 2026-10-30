import { defineConfig, devices } from "@playwright/test";

// E2E_PORT lets the tests run next to a dev server already using 3000.
const PORT = process.env.E2E_PORT ?? "3000";

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
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
