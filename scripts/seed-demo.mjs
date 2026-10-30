// Fills the LOCAL Supabase stack with demo businesses, jobs, workers and reviews.
// Usage: npm run db:seed-demo   (after npm run db:start)
// Refuses to run against anything that isn't localhost.
import { execFileSync } from "node:child_process";

const URL_ = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(URL_)) {
  console.error("Refusing to seed a non-local Supabase project:", URL_);
  process.exit(1);
}
// The local stack's secret key comes from `supabase status`; no key is stored in the repo.
function localSecretKey() {
  try {
    const env = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return env.match(/^SECRET_KEY="?([^"\n]+)"?$/m)?.[1];
  } catch {
    return undefined;
  }
}
const KEY = process.env.SUPABASE_SECRET_KEY ?? localSecretKey();
if (!KEY) {
  console.error("Could not read the local secret key. Is the stack running? Try: npm run db:start");
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const PASSWORD = "demo-pass-123";

async function api(path, init = {}) {
  const res = await fetch(`${URL_}${path}`, { ...init, headers: { ...H, Prefer: "return=representation", ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
// One request per row: PostgREST bulk inserts need identical keys in every object.
async function insert(table, rows) {
  const out = [];
  for (const row of rows) out.push(...(await api(`/rest/v1/${table}`, { method: "POST", body: JSON.stringify([row]) })));
  return out;
}
const patch = (table, query, body) => api(`/rest/v1/${table}?${query}`, { method: "PATCH", body: JSON.stringify(body) });

async function user(email, full_name, role) {
  const existing = await api(`/auth/v1/admin/users?per_page=200`);
  const found = existing.users.find((u) => u.email === email);
  if (found) return found.id;
  const u = await api("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name, role } }),
  });
  return u.id;
}

const roles = Object.fromEntries((await api("/rest/v1/job_roles?select=id,slug")).map((r) => [r.slug, r.id]));
const cuisines = Object.fromEntries((await api("/rest/v1/cuisines?select=id,slug")).map((r) => [r.slug, r.id]));
const skills = Object.fromEntries((await api("/rest/v1/skills?select=id,slug")).map((r) => [r.slug, r.id]));

const already = await api(`/rest/v1/businesses?select=id&name=eq.${encodeURIComponent("Flavora Cafe")}`);
if (already.length) {
  console.log("Demo data already present. Run `npm run db:reset` first to start over.");
  process.exit(0);
}

// ---------------------------------------------------------------- owners + businesses
const owners = [
  { email: "nishant@demo.in", name: "Nishant Gupta", biz: { name: "Flavora Cafe", category: "cafe", address: "Mill Road, Sampurna Nagar", state: "Uttar Pradesh", city: "Lucknow", pincode: "226010", phone: "9876500001", description: "Busy café near the university. Coffee, sandwiches, North Indian thalis in the evening. Team of 12." } },
  { email: "sharma@demo.in", name: "Rakesh Sharma", biz: { name: "Sharma Ji Ka Dhaba", category: "restaurant", address: "NH-730, near bus stand", state: "Uttar Pradesh", city: "Lakhimpur Kheri", pincode: "262701", phone: "9876500002", description: "Family dhaba since 1998. Tandoor, dal makhani and kadhai dishes, open till late." } },
  { email: "anita@demo.in", name: "Anita Rao", biz: { name: "Brew Republic", category: "cafe", address: "12th Main, Indiranagar", state: "Karnataka", city: "Bengaluru", pincode: "560038", phone: "9876500003", description: "Specialty coffee bar and bakery. We train baristas from scratch." } },
  { email: "joseph@demo.in", name: "Joseph Mathew", biz: { name: "Coastal Curry House", category: "restaurant", address: "MG Road, Ernakulam", state: "Kerala", city: "Kochi", pincode: "682016", phone: "9876500004", description: "Kerala seafood and appam. 60 covers, two shifts." } },
];
const biz = {};
for (const o of owners) {
  const id = await user(o.email, o.name, "employer");
  const [b] = await insert("businesses", [{ owner_id: id, ...o.biz }]);
  biz[o.biz.name] = { id: b.id, owner: id };
  await patch("profiles", `id=eq.${id}`, { onboarding_complete: true });
}
await patch("businesses", `id=in.(${biz["Flavora Cafe"].id},${biz["Brew Republic"].id})`, { verification_level: "business_verified", verified_at: new Date().toISOString() });

// ---------------------------------------------------------------- jobs
const base = { pay_frequency: "monthly", employment_type: "full_time", status: "open", openings: 1, min_experience_months: 12 };
const jobRows = [
  { ...base, business_id: biz["Sharma Ji Ka Dhaba"].id, role_id: roles.tandoor_chef, title: "Tandoor chef, evening shift", salary_min: 18000, salary_max: 24000, shift_start: "16:00", shift_end: "23:30", weekly_offs: 1, meals: "two", accommodation: true, deductions: "None", tips_info: "Tips shared equally every week", state: "Uttar Pradesh", city: "Lakhimpur Kheri", cuisine_ids: [cuisines.tandoori, cuisines.north_indian], skill_ids: [skills.tandoor_operation, skills.food_safety], openings: 2, description: "Run the tandoor for 120+ covers a night: rotis, naan, tikkas. Helper provided." },
  { ...base, business_id: biz["Flavora Cafe"].id, role_id: roles.barista, title: "Barista for morning rush", salary_min: 14000, salary_max: 17000, shift_start: "07:00", shift_end: "15:00", weekly_offs: 1, meals: "one", accommodation: false, deductions: "PF 12% of basic", state: "Uttar Pradesh", city: "Lucknow", cuisine_ids: [cuisines.cafe_beverages], skill_ids: [skills.espresso, skills.latte_art], min_experience_months: 6 },
  { ...base, business_id: biz["Flavora Cafe"].id, role_id: roles.waiter_steward, title: "Waiter / steward", salary_min: 12000, salary_max: 14000, shift_start: "12:00", shift_end: "22:00", weekly_offs: 1, meals: "two", accommodation: false, deductions: "None", tips_info: "Service charge shared monthly", state: "Uttar Pradesh", city: "Lucknow", skill_ids: [skills.table_service, skills.order_taking], min_experience_months: 0, openings: 3 },
  { ...base, business_id: biz["Brew Republic"].id, role_id: roles.baker_pastry_chef, title: "Pastry chef (croissants & tarts)", salary_min: 28000, salary_max: 35000, shift_start: "05:00", shift_end: "13:00", weekly_offs: 1, meals: "all", accommodation: false, deductions: "None", state: "Karnataka", city: "Bengaluru", cuisine_ids: [cuisines.bakery_desserts, cuisines.continental], skill_ids: [skills.pastry_baking], min_experience_months: 24 },
  { ...base, business_id: biz["Brew Republic"].id, role_id: roles.barista, title: "Head barista", salary_min: 25000, salary_max: 30000, shift_start: "08:00", shift_end: "17:00", weekly_offs: 1.5, meals: "two", accommodation: false, deductions: "PF + ESI as per law", state: "Karnataka", city: "Bengaluru", cuisine_ids: [cuisines.cafe_beverages], skill_ids: [skills.espresso, skills.latte_art, skills.staff_scheduling], min_experience_months: 36 },
  { ...base, business_id: biz["Coastal Curry House"].id, role_id: roles.south_indian_chef, title: "South Indian cook (appam, stew, fish curry)", salary_min: 20000, salary_max: 26000, shift_start: "10:00", shift_end: "22:00", weekly_offs: 1, meals: "all", accommodation: true, deductions: "₹1,500/month for shared room", state: "Kerala", city: "Kochi", cuisine_ids: [cuisines.south_indian, cuisines.regional_thali], skill_ids: [skills.dosa_idli, skills.curries_gravies] },
  { ...base, business_id: biz["Coastal Curry House"].id, role_id: roles.kitchen_helper, title: "Kitchen helper", salary_min: 11000, salary_max: 13000, shift_start: "09:00", shift_end: "21:00", weekly_offs: 0.5, meals: "all", accommodation: true, deductions: "None", state: "Kerala", city: "Kochi", skill_ids: [skills.food_prep], min_experience_months: 0, openings: 2 },
  { ...base, business_id: biz["Sharma Ji Ka Dhaba"].id, role_id: roles.cashier, title: "Cashier (night)", salary_min: 13000, salary_max: 15000, shift_start: "18:00", shift_end: "02:00", weekly_offs: 1, meals: "one", accommodation: false, deductions: "Cash shortage recovered from salary", employment_type: "part_time", state: "Uttar Pradesh", city: "Lakhimpur Kheri", skill_ids: [skills.pos_billing, skills.cash_handling], min_experience_months: 6 },
];
const jobs = [];
for (const row of jobRows) jobs.push((await insert("jobs", [row]))[0]);
const tandoorJob = jobs[0];

// ---------------------------------------------------------------- workers
const workers = [
  { email: "ravi@demo.in", name: "Ravi Kumar", p: { state: "Uttar Pradesh", city: "Lakhimpur Kheri", primary_role_id: roles.tandoor_chef, cuisine_ids: [cuisines.tandoori, cuisines.mughlai, cuisines.north_indian], skill_ids: [skills.tandoor_operation, skills.curries_gravies], total_experience_months: 62, expected_salary_min: 18000, expected_salary_max: 22000, headline: "Tandoor chef, 5 years in dhabas and hotels", languages_spoken: ["hindi"], needs_accommodation: true } },
  { email: "meera@demo.in", name: "Meera Nair", p: { state: "Kerala", city: "Kochi", primary_role_id: roles.south_indian_chef, cuisine_ids: [cuisines.south_indian, cuisines.regional_thali], skill_ids: [skills.dosa_idli, skills.curries_gravies, skills.food_safety], total_experience_months: 40, expected_salary_min: 20000, headline: "Kerala home-style cook", languages_spoken: ["malayalam", "english", "hindi"] } },
  { email: "arjun@demo.in", name: "Arjun Mehta", p: { state: "Karnataka", city: "Bengaluru", primary_role_id: roles.barista, secondary_role_ids: [roles.cashier], cuisine_ids: [cuisines.cafe_beverages], skill_ids: [skills.espresso, skills.latte_art, skills.pos_billing], total_experience_months: 30, expected_salary_min: 22000, expected_salary_max: 28000, headline: "Barista, SCA basics, latte art", languages_spoken: ["english", "hindi", "kannada"] } },
];
const workerIds = {};
for (const w of workers) {
  const id = await user(w.email, w.name, "worker");
  workerIds[w.email] = id;
  await insert("worker_profiles", [{ user_id: id, open_to_work: true, ...w.p }]);
  await insert("worker_contacts", [{ user_id: id, phone: `91234${String(Object.keys(workerIds).length).padStart(5, "0")}`, email: w.email, whatsapp_opt_in: true }]);
  await patch("profiles", `id=eq.${id}`, { onboarding_complete: true });
}
await insert("employment_history", [
  { worker_id: workerIds["ravi@demo.in"], employer_name: "Hotel Clarks Avadh", role_id: roles.tandoor_chef, start_date: "2019-04-01", end_date: "2022-06-30", reason_for_leaving: "Moved closer to family" },
  { worker_id: workerIds["arjun@demo.in"], employer_name: "Third Wave Coffee", role_id: roles.barista, start_date: "2022-01-10", end_date: "2024-08-31", reason_for_leaving: "Looking for a head barista role" },
]);

// ---------------------------------------------------------------- a finished placement at Flavora, with reviews both ways
const meera = workerIds["meera@demo.in"];
const flavoraWaiter = jobs[2];
const [app] = await insert("applications", [{ job_id: flavoraWaiter.id, worker_id: meera, status: "hired" }]);
const [pl] = await insert("placements", [{
  application_id: app.id, worker_id: meera, business_id: biz["Flavora Cafe"].id, job_id: flavoraWaiter.id,
  agreed_salary: 13500, agreed_pay_frequency: "monthly", start_date: "2025-01-06", end_date: "2025-12-20",
  employer_confirmed_at: "2025-01-05T10:00:00Z", worker_confirmed_at: "2025-01-06T10:00:00Z", status: "ended", exit_reason: "Moved back to Kochi",
}]);
await insert("employment_history", [{ worker_id: meera, employer_name: "Flavora Cafe", business_id: biz["Flavora Cafe"].id, role_id: roles.waiter_steward, job_title: "Waiter / steward", start_date: "2025-01-06", end_date: "2025-12-20", reason_for_leaving: "Moved back to Kochi", source: "platform_verified", placement_id: pl.id }]);
await insert("reviews", [
  { placement_id: pl.id, reviewer_side: "worker", reviewer_id: meera, worker_id: meera, business_id: biz["Flavora Cafe"].id, rating: 5, would_return: true, terms_matched: true, paid_on_time: true, comment: "Salary always on the 1st. Two meals as promised and the weekly off was never cancelled." },
  { placement_id: pl.id, reviewer_side: "employer", reviewer_id: biz["Flavora Cafe"].owner, worker_id: meera, business_id: biz["Flavora Cafe"].id, rating: 5, would_return: true, comment: "Calm under pressure on weekends, guests asked for her by name." },
]);

// Ravi applies to the tandoor job so the owner's board has someone in it.
await insert("applications", [{ job_id: tandoorJob.id, worker_id: workerIds["ravi@demo.in"], cover_note: "5 years on tandoor, can join in a week." }]);

// ---------------------------------------------------------------- a local admin, plus something in the queues
const adminId = await user("admin@demo.in", "Demo Admin", "worker");
await patch("profiles", `id=eq.${adminId}`, { is_admin: true, onboarding_complete: true });
await insert("reports", [{ reporter_id: workerIds["arjun@demo.in"], target_type: "job", target_id: jobs[7].id, reason: "wrong_terms", details: "Salary deductions for cash shortage were not mentioned on the phone." }]);

console.log(`Demo data ready. Log in with any of these (password: ${PASSWORD}):`);
for (const e of [...owners.map((o) => o.email), ...workers.map((w) => w.email)]) console.log("  ", e);
console.log("   admin@demo.in  (admin)");
