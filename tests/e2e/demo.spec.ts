import { execSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

// Demo / acceptance script from MVP_PLAN.md section 11, run end to end.
// Needs: npm run db:start (local Supabase, email confirmation off) and a production build.

const run = Date.now().toString(36);
const OWNER = { name: "Nishant Gupta", email: `owner-${run}@example.com`, password: "flavora-pass-1" };
const WORKER = { name: "Ravi Kumar", email: `worker-${run}@example.com`, password: "ravi-pass-123" };
const WORKER2 = { name: "Amit Singh", email: `worker2-${run}@example.com`, password: "amit-pass-123" };
const CAFE = `Flavora Cafe ${run}`;
const CITY = `Lakhimpur${run}`; // unique city so searches only find this run's data

function sql(query: string) {
  return execSync(`docker exec -i supabase_db_hospitality-hiring psql -U postgres -tA -c "${query.replace(/"/g, '\\"')}"`).toString().trim();
}

async function signUp(page: Page, user: typeof OWNER, role: "worker" | "employer", locale = "en") {
  await page.goto(`/${locale}/signup?role=${role}`);
  await page.locator('input[name="full_name"]').fill(user.name);
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('form:has(input[name="full_name"]) button[type="submit"]').click();
  await page.waitForURL(`**/${locale}/onboarding`);
}

test.describe.serial("MVP demo script", () => {
  let jobUrl = "";

  test("1-2. owner signs up, creates business, cannot publish without terms, publishes job", async ({ page }) => {
    await signUp(page, OWNER, "employer");

    await page.getByLabel("Business name").fill(CAFE);
    await page.getByLabel("Type of business").selectOption("cafe");
    await page.getByLabel("Address").fill("Mill Road, Sampurna Nagar");
    await page.getByLabel("State").selectOption("Uttar Pradesh");
    await page.getByLabel("City / town").fill(CITY);
    await page.getByLabel("PIN code").fill("262904");
    await page.getByLabel("Business phone").fill("9876543210");
    await page.getByRole("button", { name: "Create business profile" }).click();
    await page.waitForURL("**/en/e");
    await expect(page.getByText("Email verified").first()).toBeVisible();

    await page.goto("/en/e/jobs/new");
    await page.locator('select[name="role_id"]').selectOption({ label: "Tandoor Chef" });
    await page.getByLabel("Job title").fill("Tandoor chef for evening shift");
    await page.getByLabel("Salary from (₹)").fill("18000");
    await page.getByLabel("Salary up to (₹)").fill("24000");
    await page.getByLabel("Shift starts").fill("11:00");
    await page.getByLabel("Shift ends").fill("23:00");
    await page.getByLabel("Meals").selectOption("two");
    await page.getByLabel("Accommodation provided?").selectOption("yes");
    await page.getByLabel("Deductions from salary").fill("None");
    await page.getByLabel("City / town").fill(CITY);

    // Weekly offs left empty -> the browser blocks publishing.
    await page.getByRole("button", { name: "Publish job" }).click();
    await expect(page).toHaveURL(/\/e\/jobs\/new$/);
    expect(await page.getByLabel("Weekly offs").evaluate((el: HTMLSelectElement) => el.validity.valueMissing)).toBe(true);

    await page.getByLabel("Weekly offs").selectOption("1");
    await page.getByRole("button", { name: "Publish job" }).click();
    await page.waitForURL(/\/en\/e\/jobs\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
    jobUrl = new URL(page.url()).pathname.replace("/en/e/jobs/", "/jobs/");

    // Public page has the WhatsApp share button.
    await page.goto(`/en${jobUrl}`);
    await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  });

  test("3. worker signs up and completes onboarding in Hindi, adds self-reported history", async ({ page }) => {
    await signUp(page, WORKER, "worker", "hi");
    await expect(page.getByRole("heading", { name: "अपनी काम की प्रोफ़ाइल बनाएँ" })).toBeVisible();

    await page.getByLabel("मोबाइल नंबर").fill("9123456789");
    await page.getByLabel("राज्य").selectOption("Uttar Pradesh");
    await page.getByLabel("शहर / कस्बा").fill(CITY);
    await page.getByLabel("मुख्य रोल").selectOption({ label: "तंदूर शेफ" });
    await page.getByRole("group", { name: "कौन सा खाना बनाना जानते हैं" }).getByRole("checkbox", { name: "तंदूरी" }).check({ force: true });
    await page.getByLabel("अनुभव (साल)").fill("4");
    await page.getByRole("button", { name: "सेव करें और आगे बढ़ें" }).click();
    await page.waitForURL("**/hi/w");
    await expect(page.getByText("नमस्ते, Ravi Kumar")).toBeVisible();

    await page.goto("/hi/w/profile");
    await page.getByText("+ पिछली नौकरी जोड़ें").click();
    await page.getByLabel("रेस्टोरेंट / मालिक का नाम").fill("Sharma Dhaba");
    await page.getByLabel("शुरू किया").fill("2022-01-01");
    await page.locator('input[name="end_date"]').fill("2024-01-01");
    await page.getByLabel("छोड़ने की वजह").fill("Salary was paid late");
    await page.getByRole("button", { name: "नौकरी जोड़ें" }).click();
    await expect(page.getByText("Sharma Dhaba")).toBeVisible();
    await expect(page.getByText("खुद बताया गया", { exact: true })).toBeVisible();
  });

  test("4. worker filters jobs, sees full terms, applies once", async ({ page }) => {
    await page.goto("/en/login");
    await page.getByLabel("Email").fill(WORKER.email);
    await page.getByLabel("Password").fill(WORKER.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/\/en\/(w|dashboard)/);

    await page.goto(`/en/jobs?city=${CITY}&role=2&stay=1`);
    await page.getByRole("link", { name: /Tandoor chef for evening shift/ }).click();
    await page.waitForURL(`**/en${jobUrl}`);
    const terms = page.locator("dl");
    for (const text of ["Salary", "Shift timing", "Weekly off", "2 meals", "Provided", "None"]) {
      await expect(terms.getByText(text, { exact: true }).first()).toBeVisible();
    }

    await page.getByLabel("Message to the owner").fill("4 years tandoor experience");
    await page.getByRole("button", { name: "Apply now" }).click();
    await expect(page.getByText("You applied to this job.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply now" })).toHaveCount(0);
  });

  test("4b. a second worker reports the job while it is open", async ({ browser }) => {
    // A second worker reports the job.
    const w2 = await browser.newPage();
    await signUp(w2, WORKER2, "worker");
    await w2.goto(`/en${jobUrl}`);
    await w2.getByRole("button", { name: "Report this job" }).click();
    await w2.getByLabel("What's wrong?").selectOption("wrong_terms");
    await w2.getByLabel("Details").fill(`Salary is lower in reality ${run}`);
    await w2.getByRole("button", { name: "Send report" }).click();
    await expect(w2.getByText("Report sent. Our team will look into it.")).toBeVisible();
    await w2.close();
  });

  test("5-6. owner pipeline: hidden contacts, note, shortlist, interview, hire; worker confirms joining", async ({ browser }) => {
    const owner = await browser.newPage();
    await owner.goto("/en/login");
    await owner.getByLabel("Email").fill(OWNER.email);
    await owner.getByLabel("Password").fill(OWNER.password);
    await owner.getByRole("button", { name: "Log in", exact: true }).click();
    await owner.waitForURL("**/en/e");

    await owner.getByRole("link", { name: /Tandoor chef for evening shift/ }).click();
    await owner.getByRole("link", { name: /Ravi Kumar/ }).click();
    await expect(owner.getByText("Shortlist this applicant to see their phone number and email.")).toBeVisible();
    await expect(owner.getByText("Sharma Dhaba")).toBeVisible();
    await expect(owner.getByText("Self-reported", { exact: true })).toBeVisible();

    await owner.getByLabel("Add note").fill("Strong tandoor skills, ask about notice period");
    await owner.getByRole("button", { name: "Add note" }).click();
    await expect(owner.getByText("Strong tandoor skills, ask about notice period")).toBeVisible();

    await owner.getByRole("button", { name: "Shortlist" }).click();
    await expect(owner.getByRole("link", { name: "9123456789" })).toBeVisible();

    await owner.getByLabel("Date and time (IST)").fill("2026-11-02T16:00");
    await owner.getByLabel("Instructions").fill("Ask for Nishant at the counter");
    await owner.getByRole("button", { name: "Save interview" }).click();
    await expect(owner.getByText(/Interview: 2 Nov/)).toBeVisible();

    owner.once("dialog", (d) => d.accept());
    await owner.getByLabel("Agreed salary (₹)").fill("22000");
    await owner.getByRole("button", { name: "Mark as hired" }).click();
    await expect(owner.getByText("Waiting for the worker to confirm joining.")).toBeVisible();

    const worker = await browser.newPage();
    await worker.goto("/en/login");
    await worker.getByLabel("Email").fill(WORKER.email);
    await worker.getByLabel("Password").fill(WORKER.password);
    await worker.getByRole("button", { name: "Log in", exact: true }).click();
    await worker.waitForURL(/\/en\/(w|dashboard)/);
    await worker.goto("/en/w/applications");
    await expect(worker.getByText(/Agreed: ₹22,000/)).toBeVisible();
    await worker.getByRole("button", { name: "Yes, I joined" }).click();
    await expect(worker.getByText("Working", { exact: true })).toBeVisible();

    await worker.goto("/en/w/profile");
    await expect(worker.getByText("✓ Verified")).toBeVisible();
    await expect(worker.getByText("Self-reported", { exact: true })).toBeVisible();

    // Job had 1 opening -> filled automatically.
    await owner.goto("/en/e");
    await expect(owner.getByText("Filled", { exact: true })).toBeVisible();
    await owner.close();
    await worker.close();
  });

  test("7. report -> admin resolves it and verifies the business; audit log records both", async ({ browser }) => {
    // Make the owner an admin (team members are admins; set by SQL only).
    sql(`update public.profiles set is_admin = true where id = (select id from auth.users where email = '${OWNER.email}')`);

    const admin = await browser.newPage();
    await admin.goto("/en/login");
    await admin.getByLabel("Email").fill(OWNER.email);
    await admin.getByLabel("Password").fill(OWNER.password);
    await admin.getByRole("button", { name: "Log in", exact: true }).click();
    await admin.waitForURL("**/en/e");

    await admin.goto("/en/admin/reports");
    const report = admin.locator("div.rounded-xl", { hasText: `Salary is lower in reality ${run}` });
    await report.locator('select[name="status"]').selectOption("resolved");
    await report.locator('input[name="note"]').fill("Called the owner, salary corrected");
    await report.getByRole("button", { name: "Save" }).click();
    // Resolved reports drop out of the default "open" list.
    await expect(report).toHaveCount(0);
    expect(sql(`select status from public.reports where details = 'Salary is lower in reality ${run}'`)).toBe("resolved");

    await admin.goto("/en/admin/businesses");
    const biz = admin.locator("div.rounded-xl", { hasText: CAFE });
    await biz.locator('select[name="level"]').selectOption("business_verified");
    await biz.getByRole("button", { name: "Save" }).click();
    // Verified businesses drop out of the default "not verified" list.
    await expect(biz).toHaveCount(0);

    await admin.goto("/en/admin/audit");
    await expect(admin.getByText("report.status_changed").first()).toBeVisible();
    await expect(admin.getByText("business.verification_changed").first()).toBeVisible();

    await admin.goto(`/en${jobUrl}`);
    await expect(admin.getByText("✓Business verified").or(admin.getByText("✓ Business verified")).first()).toBeVisible();
    await admin.close();
  });

  test("8. another worker cannot read contacts, notes or applications through the API", async () => {
    // Plain REST calls with worker 2's token: the same thing anyone could do from a browser console.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
    const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ email: WORKER2.email, password: WORKER2.password }),
    }).then((r) => r.json());
    expect(auth.access_token).toBeTruthy();
    const headers = { apikey: key, Authorization: `Bearer ${auth.access_token}`, "Content-Type": "application/json" };
    const get = (path: string) => fetch(`${url}/rest/v1/${path}`, { headers }).then((r) => r.json());

    const workerId = sql(`select id from auth.users where email = '${WORKER.email}'`);
    expect(await get(`worker_contacts?user_id=eq.${workerId}`)).toEqual([]);
    expect(await get("application_notes")).toEqual([]);
    expect(await get(`applications?worker_id=eq.${workerId}`)).toEqual([]);

    const selfVerify = await fetch(`${url}/rest/v1/employment_history`, {
      method: "POST",
      headers,
      body: JSON.stringify({ worker_id: auth.user.id, employer_name: "Fake Hotel", start_date: "2020-01-01", source: "platform_verified" }),
    });
    expect(selfVerify.status).toBeGreaterThanOrEqual(400);
  });
});
