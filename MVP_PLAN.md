# Restaurant & Café Hiring Platform: 2-Day MVP Plan

Team: Group 25 (Saurabh, Shahid, Sarthak, Anoop)
Goal: a working, deployed web app that existing clients can use for real hiring by the end of Day 2.
Sources: Define phase doc, Empathy worksheet (Group_25.pdf), Startup Blueprint.

---

## 1. What the MVP must prove

The MVP answers the three How Might We questions with the smallest working feature set:

| HMW | MVP answer |
|---|---|
| Owners and workers find each other without personal contacts | Job board + candidate search, filtered by state, city, role and cuisine |
| Owner sees a worker's past history and reliability before hiring | Work history with **self-reported** vs **platform-verified** labels; verified entries come only from confirmed placements |
| Worker sees real conditions before joining | A job cannot be published without salary, shift timing, weekly offs, meals, accommodation and deductions |

Anything that doesn't serve one of these rows waits until after the MVP.

---

## 2. Tech stack decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Agreed. Server Actions handle mutations, so no separate backend is needed |
| Database + Auth + Storage | **Supabase** (not Neon) | Neon is only Postgres. With Neon we'd also need an auth library, file storage and our own access control. Supabase gives Postgres, email/password + Google auth, photo storage and Row Level Security (RLS) in one place. In a 2-day build that saves most of a day |
| Auth | Supabase Auth: email/password + **Google sign-in** | No Firebase needed. Google sign-in is free and most Android users already have a Gmail account, which removes the password step for workers |
| Auth emails | **Resend** as custom SMTP in Supabase | Supabase's built-in email sender only delivers to your own team's addresses and is capped at 2 emails/hour ([Supabase docs](https://supabase.com/docs/guides/auth/auth-smtp)). Real clients would never get confirmation emails without this |
| UI | Tailwind CSS + shadcn/ui | Fastest way to get clean, mobile-friendly forms and tables |
| Forms/validation | react-hook-form + Zod | One Zod schema validates both the browser form and the Server Action |
| i18n | next-intl, routes `/en/...` and `/hi/...` | Standard for the App Router |
| Location | Static JSON of Indian states → cities + pincode field | Pan-India without PostGIS. Distance search comes later |
| Hosting | Vercel (app) + Supabase (DB) | Zero-config deploys from GitHub, with a preview URL for every PR |

**Supabase plan note:** free projects pause after a week without activity, and the free tier has no daily backups. You have paying clients, so move to the Pro plan once real users are on it.

---

## 3. Suggested changes after reviewing all three documents

1. **Make job terms mandatory, not optional.** HMW 3 is the strongest differentiator against WhatsApp groups and general portals. The "Publish" button stays disabled until salary range, pay frequency, shift start/end, weekly offs, meals and accommodation are filled in. Deductions are a required text field ("None" is a valid answer).
2. **Store applications, placements and work history separately** (blueprint section 7). When both owner and worker confirm "joined", the app creates a work-history entry marked `platform_verified`. Everything the worker types in is `self_reported`. This one rule makes the "trust" claim honest from day one, and it costs about 2 hours.
3. **Record "reason for leaving" on work history.** The blueprint warns against penalising job-hopping, since people often leave over unpaid wages or bad hours. One optional field captures that context. Don't build a "job-hopper score".
4. **Hide contact details until the owner shortlists.** Phone and email live in a separate table, readable only by the owner of a job the worker applied to, and only once the application reaches `shortlisted`. This is P0 privacy in the blueprint and protects workers from spam.
5. **Use WhatsApp as a distribution channel.** Owners already post in WhatsApp groups. Every job page gets a "Share on WhatsApp" button (`https://wa.me/?text=...`). It's free, takes 30 minutes, and brings traffic back to the platform.
6. **Use honest verification levels instead of one badge:** `Unverified` → `Email verified` → `Business verified (checked by our team)`. An admin sets the last level manually after a phone call or a document check.
7. **Expire stale jobs.** Each job gets `expires_at` (30 days) and a "Still hiring?" button that refreshes `last_confirmed_at`. Job cards show "Active 2 days ago". The blueprint lists stale listings as a common competitor weakness.
8. **Make the worker side mobile-first.** Workers use phones. Design every worker screen at 360px width first. The owner dashboard must work on mobile too, since Nishant runs the café floor himself.
9. **Cut from the 2-day scope** (all P1/P2 in the blueprint): phone OTP, chat, ratings (they need a confirmed employment period first), AI features, payments/subscriptions, temporary/urgent shift module, voice profiles, skill assessments, multi-branch accounts.
10. **Simplify interviews.** There is no calendar integration. Moving an application to `interview` asks for a date/time and an optional note, which the worker sees on their Applications page.
11. **Translate the taxonomy, not user content.** Roles, cuisines and skills live in tables with `name_en` and `name_hi` columns, so filters and badges show in Hindi automatically. Job descriptions stay in whatever language the owner wrote them.
12. **Fix in the documents:** the Define doc says Nishant is 24 with 3 years in business. The Empathy worksheet says 28 and 6 years. Pick one before any client or jury presentation.

---

## 4. MVP feature checklist

### Worker
- [ ] Sign up / log in (email+password, Google), choose role "I'm looking for work"
- [ ] Onboarding wizard (3 short steps, save-and-resume): basics → role/skills/cuisines → pay and shift preferences
- [ ] Profile: photo, state/city/pincode, primary + secondary roles, cuisines, skills, total experience, expected salary, preferred shift, employment type, languages spoken, open-to-work toggle, needs accommodation, willing to relocate
- [ ] Add self-reported work history (employer name, role, dates, reason for leaving)
- [ ] Browse and search jobs: filters for state, city, role, cuisine, salary min, shift, meals, accommodation, employment type
- [ ] Job detail page with the full terms block
- [ ] One-tap apply (blocked if already applied)
- [ ] My Applications: status, interview time, withdraw
- [ ] Confirm "I joined" when an owner marks them hired
- [ ] Report a job

### Restaurant owner
- [ ] Sign up, choose role "I'm hiring"
- [ ] Business profile: name, category, address, state/city/pincode, contact phone, photos
- [ ] Post a job (mandatory terms, see change 1), save as draft, pause, close, duplicate
- [ ] "Still hiring?" refresh and WhatsApp share
- [ ] Applicants per job: pipeline `applied → shortlisted → interview → offered → hired / rejected`
- [ ] Private notes on applicants (worker never sees them)
- [ ] Contact details revealed after shortlisting
- [ ] Mark hired → enter agreed salary + start date → worker confirms → verified history created
- [ ] Candidate search (open-to-work workers only, no contact details), "invite to apply" stretch goal
- [ ] Dashboard: open jobs, new applicants, hires this month
- [ ] Report a candidate

### Admin
- [ ] Businesses list → set verification level
- [ ] Reports queue → mark reviewing / resolved / dismissed, with notes
- [ ] Jobs list → close or hide a job
- [ ] Every admin action written to `audit_logs`

### Platform
- [ ] English + Hindi UI with a language switcher, saved to the user's profile
- [ ] RLS on every table
- [ ] Seed data: roles, cuisines, skills, states/cities
- [ ] Deployed on Vercel with a production Supabase project
- [ ] Stretch: email notifications on application status change (Resend)

---

## 5. Database schema

All tables have `id uuid primary key default gen_random_uuid()` and `created_at timestamptz default now()` unless noted.

### Taxonomy (seeded, read-only for users)
```
roles     (id, slug, name_en, name_hi, category: kitchen|service|management)
cuisines  (id, slug, name_en, name_hi)
skills    (id, slug, name_en, name_hi, role_category)
```
Seed roles: Indian chef, tandoor chef, Chinese chef, continental chef, baker/pastry chef, barista, commis/kitchen helper, waiter/steward, captain/floor supervisor, cashier, dishwasher/cleaner, restaurant manager, delivery staff.
Seed cuisines: North Indian, Mughlai, South Indian, Chinese/Indo-Chinese, Continental, Italian, Bakery & Desserts, Street food, Café/Beverages.

### Users
```
profiles            (id = auth.users.id, role: worker|employer|admin, full_name,
                     preferred_language: en|hi, onboarding_complete bool)

worker_profiles     (user_id PK → profiles, photo_url, state, city, pincode,
                     primary_role_id → roles, total_experience_months int,
                     expected_salary_min int, expected_salary_max int,
                     pay_frequency: monthly|weekly|daily,
                     preferred_shift: morning|evening|night|split|any,
                     employment_types text[]  -- full_time, part_time, temporary, seasonal
                     languages_spoken text[], open_to_work bool,
                     needs_accommodation bool, willing_to_relocate bool,
                     available_from date, about text, updated_at)

worker_contacts     (user_id PK, phone, email, whatsapp_opt_in bool)
                     -- separate table so RLS can hide it until shortlisting

worker_roles        (worker_id, role_id)          -- secondary roles
worker_cuisines     (worker_id, cuisine_id)
worker_skills       (worker_id, skill_id)
```

### Businesses and jobs
```
businesses   (owner_id → profiles, name, category: cafe|restaurant|qsr|bakery|
              cloud_kitchen|hotel|catering|bar, address, state, city, pincode,
              phone, description, photo_urls text[],
              verification_level: unverified|email_verified|business_verified,
              verified_at, verified_by)

jobs         (business_id, role_id, title, description, openings int,
              min_experience_months int,
              salary_min int NOT NULL, salary_max int NOT NULL,
              pay_frequency NOT NULL,
              shift_start time NOT NULL, shift_end time NOT NULL,
              weekly_offs numeric NOT NULL,        -- 0, 0.5, 1, 2
              meals: none|one|two|all NOT NULL,
              accommodation bool NOT NULL,
              tips_info text, deductions text NOT NULL,
              employment_type NOT NULL, joining_date date,
              state, city,                          -- copied from business, editable
              status: draft|open|paused|closed|filled,
              last_confirmed_at timestamptz, expires_at timestamptz)

job_cuisines (job_id, cuisine_id)
job_skills   (job_id, skill_id)
```
Add a CHECK constraint `salary_max >= salary_min` and indexes on `jobs(status, state, city, role_id)`.

### Hiring
```
applications      (job_id, worker_id, status: applied|shortlisted|interview|
                   offered|hired|rejected|withdrawn,
                   interview_at timestamptz, interview_note text,
                   updated_at, UNIQUE(job_id, worker_id))

application_notes (application_id, author_id, body)   -- employer-only, private

placements        (application_id UNIQUE, worker_id, business_id, job_id,
                   agreed_salary int, agreed_pay_frequency, start_date,
                   employer_confirmed_at, worker_confirmed_at,
                   status: pending|active|ended, end_date, exit_reason)

employment_history (worker_id, employer_name, business_id nullable,
                    role_id, start_date, end_date nullable, reason_for_leaving,
                    source: self_reported|platform_verified,
                    placement_id nullable UNIQUE)
```
A database trigger runs when both `employer_confirmed_at` and `worker_confirmed_at` are set on a placement. It sets `status = active`, inserts a `platform_verified` row into `employment_history`, and moves the job to `filled` once hired count reaches `openings`.

### Trust and admin
```
reports     (reporter_id, target_type: job|business|worker, target_id,
             reason: fake_job|wrong_terms|harassment|unpaid_wages|false_profile|spam|other,
             details, status: open|reviewing|resolved|dismissed, admin_note)

audit_logs  (actor_id, action, target_type, target_id, metadata jsonb)
```

### RLS rules (summary)
| Table | Read | Write |
|---|---|---|
| taxonomy | everyone | admin only |
| profiles | self; admin | self (not `role` after onboarding) |
| worker_profiles + worker_* | any logged-in employer if `open_to_work`; self; admin | self |
| worker_contacts | self; employer whose job has an application from this worker with status in (shortlisted, interview, offered, hired); admin | self |
| businesses | everyone | owner (not `verification_level`); admin |
| jobs | everyone if `open`; owner sees all their jobs | business owner |
| applications | the worker; the job's business owner | worker inserts/withdraws; owner updates status |
| application_notes | job's business owner only | job's business owner |
| placements | worker and business owner | owner creates; each side sets only its own `*_confirmed_at` |
| employment_history | self; employers who can see the worker profile | self for `self_reported` only; `platform_verified` rows only via trigger |
| reports | reporter; admin | any logged-in user inserts; admin updates |
| audit_logs | admin | inserted by server code only |

Status changes such as "only the owner can move to shortlisted" and "a worker can only withdraw" go in Server Actions with Zod checks. RLS is the safety net, not the only check. Never send the Supabase service-role key to the browser.

---

## 6. Pages and routes

All routes sit under `/[locale]` (`en` | `hi`).

| Route | Who | Purpose |
|---|---|---|
| `/` | public | Two buttons: Find a Job / Hire Staff; latest jobs |
| `/jobs`, `/jobs/[id]` | public | Search + job detail (log in to apply) |
| `/login`, `/signup` | public | Auth, role choice on signup |
| `/onboarding` | new user | Worker wizard or business profile form |
| `/w` | worker | Recommended jobs (same city + role) |
| `/w/profile` | worker | Edit profile + work history |
| `/w/applications` | worker | Status list, interview info, withdraw, confirm joining |
| `/e` | employer | Dashboard |
| `/e/jobs/new`, `/e/jobs/[id]/edit` | employer | Job form |
| `/e/jobs/[id]` | employer | Applicant pipeline for that job |
| `/e/candidates`, `/e/candidates/[id]` | employer | Search open-to-work workers |
| `/e/team` | employer | Placements (hired staff), confirm/end |
| `/e/business` | employer | Business profile + verification status |
| `/admin`, `/admin/businesses`, `/admin/reports`, `/admin/jobs` | admin | Moderation |

`middleware.ts` handles locale routing, refreshes the Supabase session, and redirects by role (`/w/*` workers only, `/e/*` employers only, `/admin/*` admins only).

---

## 7. Repository structure

```
app/[locale]/(public)/...      public pages
app/[locale]/(worker)/w/...    worker pages
app/[locale]/(employer)/e/...  employer pages
app/[locale]/(admin)/admin/... admin pages
components/ui/                 shadcn components
components/                    shared components (JobCard, TermsBlock, StatusBadge, ...)
lib/supabase/                  server.ts, client.ts, middleware.ts (@supabase/ssr)
lib/actions/                   Server Actions: jobs.ts, applications.ts, profile.ts, admin.ts
lib/queries/                   read queries used by pages
lib/validation/                Zod schemas, shared by forms and actions
lib/data/india-locations.json  states → cities
messages/en.json, messages/hi.json
supabase/migrations/           SQL migrations (DB owner only)
supabase/seed.sql              taxonomy seed
types/database.ts              generated: supabase gen types typescript
```

---

## 8. Team split

You asked to own the frontend. One person can't build ~20 screens in 2 days alongside integration, so **Dev 4 takes the admin pages and the Hindi translations**. Both of those reuse your components.

| Person | Owns | Deliverables |
|---|---|---|
| **Dev 1 (you): Frontend** | All worker + employer + public pages | Layouts, design system (shadcn theme), JobCard, TermsBlock, filters, onboarding wizard, job form, applicant pipeline UI, mobile-first responsive work |
| **Dev 2: Database** | Supabase project, schema, RLS, triggers, seed | Migrations in `supabase/migrations`, RLS policies, placement → history trigger, seed SQL, generated TS types. **Schema is frozen by hour 3 on Day 1**; later changes go only through Dev 2 |
| **Dev 3: Server logic + Auth** | Auth flows, middleware, Server Actions, queries | Signup with role, Google OAuth, Resend SMTP, role redirects, all `lib/actions/*` and `lib/queries/*` with Zod, job search query with filters + pagination, contact-reveal logic |
| **Dev 4: Admin, i18n, Ops, QA** | Admin pages, translations, deploy, testing | Admin moderation pages + audit logging, next-intl setup, `hi.json` translations (by a native Hindi speaker, not machine-only), Vercel + env vars, test accounts, end-to-end test script, client onboarding/data import from the old app |

**Unblocking rule:** you start Day 1 on static UI with mock data typed against the agreed schema. Swap to real queries as Dev 3 merges them. Nobody waits on anybody.

---

## 9. Schedule

### Day 1
| Time | Dev 1 (Frontend) | Dev 2 (DB) | Dev 3 (Server/Auth) | Dev 4 (Admin/i18n/Ops) |
|---|---|---|---|---|
| 0–1h | **All four together:** agree this plan, schema and route list; create GitHub repo, protect `main`; create Supabase + Vercel projects | | | |
| 1–3h | Next.js scaffold, Tailwind, shadcn, layouts, navbar, language switcher | Write schema migration + taxonomy seed | Supabase SSR clients, middleware, signup/login (email + Google) | next-intl setup, `en.json` skeleton, Resend SMTP config, Vercel env vars |
| 3–6h | Home, job list + filters, job detail (mock data) | RLS policies for all tables; **freeze schema**; generate types | Onboarding actions (worker profile, business profile), role redirect | Admin layout + businesses verification page |
| 6–10h | Worker onboarding wizard, worker profile + work history | Placement trigger, `filled` logic, indexes | Job CRUD actions, job search query, apply action | Admin reports + jobs pages, audit log helper |
| End of Day 1 | **Merge + demo:** sign up as worker and as owner, post a job, worker finds it and applies | | | |

### Day 2
| Time | Dev 1 | Dev 2 | Dev 3 | Dev 4 |
|---|---|---|---|---|
| 0–4h | Employer dashboard, job form (mandatory terms), applicant pipeline | RLS tests: try reading contacts/notes as the wrong user | Pipeline status actions, notes, contact reveal, placements + confirm actions | Hindi translations for all strings + taxonomy `name_hi` check |
| 4–7h | Worker applications page, `/e/team`, candidate search | Help Dev 3; seed realistic demo data | Report action, "still hiring" refresh, expiry filter, WhatsApp share | Full end-to-end test on a real phone (Android Chrome), bug list |
| 7–9h | Bug fixes, mobile polish, empty/loading/error states | Backups check, production project ready | Bug fixes, stretch: status emails | Production deploy, create admin account, client test accounts |
| 9–10h | **All four:** final run through the demo script below on the production URL | | | |

**If you fall behind, cut in this order:** candidate search → `/e/team` page (keep the confirm button on the application) → admin jobs page (use the Supabase dashboard) → dashboard stats. Never cut mandatory job terms, verified/self-reported labels, contact hiding or RLS. Those are the product.

---

## 10. Git workflow (per the CPS Master Guide)

- `main` is protected: no direct pushes, no force-push, 1 approval to merge.
- One short-lived branch per unit of work: `feature/job-form`, `feature/rls-policies`, `fix/apply-duplicate`.
- Daily loop: `git switch main && git pull` → `git switch -c feature/x` → commit → `git fetch origin && git rebase origin/main` → `git push -u origin feature/x` → PR → squash & merge → delete branch.
- Conventional Commits, imperative subject: `feat: add mandatory terms to job form`, `fix: block duplicate applications`.
- In a 2-day sprint, **merge small PRs every 2–3 hours** to avoid conflicts. Vercel preview URLs let the reviewer click through instead of only reading code.
- `.env.local` is in `.gitignore`. Share keys privately, never in the repo or chat logs.
- Only Dev 2 edits `supabase/migrations/`. Everyone runs `supabase gen types` after a migration merges.
- Tag the release: `git tag -a v0.1.0 -m "MVP"`.

---

## 11. Demo / acceptance script (definition of done)

Run this on the production URL, on a phone, in both languages:

1. Owner signs up with Google, creates "Flavora Cafe" in a chosen city, sees "Unverified".
2. Owner tries to publish a Tandoor Chef job without weekly offs → blocked. Fills all terms → published. Shares it on WhatsApp.
3. Worker signs up with email, completes onboarding in Hindi, adds one self-reported past job with a reason for leaving.
4. Worker filters jobs by city + "Tandoor chef" + "accommodation", opens the job, sees salary/shift/offs/meals/deductions, applies. A second apply is blocked.
5. Owner sees the applicant without phone/email, adds a private note, shortlists → contact appears. Sets interview time → worker sees it.
6. Owner marks hired with agreed salary + start date → worker confirms joining → worker profile now shows a **Verified** history entry next to the **Self-reported** one.
7. Worker reports a different job → admin sees it, resolves it; admin marks Flavora Cafe "Business verified"; both actions appear in audit logs.
8. Logged in as a different worker, try to open the first worker's contacts or the owner's notes via the API → denied.

---

## 12. After the MVP (in order)

1. Phone OTP login (MSG91 or Twilio). The blueprint says entry-level workers shouldn't need an email.
2. 7/30/90-day check-ins on placements and retention stats (the blueprint's core success metric).
3. Mutual ratings after a confirmed employment period, with a dispute path.
4. Reference requests to previous employers for self-reported history.
5. Urgent shift / temporary staffing module as a separate workflow.
6. Employer subscriptions via Razorpay (₹499 / ₹1,499 hypotheses from the blueprint).
7. Distance-based search (PostGIS) and regional languages.

---

## 13. Open questions

1. **Old app:** what was it, and is there client data (restaurants, workers) to import? If so, Dev 4 needs the format on Day 1 to write an import script.
2. **Name and domain:** what is the product called, and do you own a domain? Resend needs a verified domain to send auth emails.
3. **Admins:** who on the team gets admin accounts?
4. **Translations:** who on the team will review the Hindi strings?
