# HospitalityHire (working name)

Hiring marketplace for restaurants and cafés in India. Owners post jobs with **mandatory, transparent terms**; workers apply, and jobs found here become **Verified** work history once both sides confirm joining.

Stack: Next.js 16 (App Router, `proxy.ts`) · TypeScript · Tailwind 4 · Supabase (Postgres + Auth + RLS) · next-intl (English + Hindi).

The product name is a placeholder. Change it in `lib/brand.ts`.

---

## 1. Run it locally (≈10 minutes)

Requirements: Node 20+ (22 recommended), Docker running.

```bash
npm install
npm run db:start          # local Supabase in Docker, applies supabase/migrations/*
cp .env.example .env.local
# paste the "Project URL" and "Publishable" key printed by db:start into .env.local
npm run dev               # http://localhost:3000
```

Local auth emails (confirmations, password resets) go to Mailpit at http://127.0.0.1:54324.

Demo data (4 restaurants, 8 jobs, 3 workers, a finished placement with reviews):

```bash
npm run db:reset && npm run db:seed-demo   # local only; refuses to run against a hosted project
# owners: nishant@ sharma@ anita@ joseph@  workers: ravi@ meera@ arjun@  admin: admin@  (all @demo.in, password demo-pass-123)
```

Make yourself an admin (all four of us are admins):

```bash
docker exec -i supabase_db_hospitality-hiring psql -U postgres -c \
  "update public.profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');"
```

## 2. Checks before every PR

```bash
npm run typecheck         # also fails on missing translation keys (keys are typed from messages/en.json)
npm run lint
npm run check:messages    # hi.json has exactly the same keys and {placeholders} as en.json
npm run db:test           # RLS + RPC tests (2 files) on a throwaway Postgres container
npm run build && npm run test:e2e   # 11 end-to-end tests at phone size (needs db:start)
```

## 3. Production setup (Supabase Cloud + Vercel)

1. Create a Supabase project (region: Mumbai `ap-south-1`).
2. Push the schema: `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push`.
3. **Auth → URL configuration**: Site URL = your domain; add `https://<domain>/**` and `https://*-<team>.vercel.app/**` to redirect URLs.
4. **Auth → SMTP**: connect Resend (or any SMTP). The built-in sender only emails your own team and is capped at 2 emails/hour, so clients won't receive confirmation emails without this. Resend needs a verified domain.
5. **Auth → Providers → Google**: add a Google OAuth client ID/secret (Google Cloud Console → Credentials, redirect URI `https://<ref>.supabase.co/auth/v1/callback`).
6. Vercel: import the GitHub repo, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
7. Make the team admins with the SQL above (Supabase SQL editor).
   Photo buckets (`avatars`, `business-photos`) and their policies are created by migration 3; nothing to click.
8. Move to the Supabase Pro plan once real clients are on it: free projects pause after a week of inactivity and have no daily backups.

The app never uses the service-role / secret key. Don't add it.

## 4. How it is built

```
proxy.ts                      session refresh + locale routing + optimistic login redirects
i18n/                         next-intl routing/request config
messages/en.json, hi.json     all UI text (Hindi is a first draft, needs native review)
app/[locale]/                 pages. (/w = worker, /e = employer, /admin)
app/api/auth/callback         Google + email-link sign-in
lib/auth.ts                   getCurrentUser / requireWorker / requireBusiness / requireAdmin
lib/actions/*.ts              Server Actions (all writes). Every action re-checks the user.
lib/validation.ts             Zod schemas shared by all actions
components/action-form.tsx    <ActionForm>/<SubmitButton>: useActionState wrapper, inline errors
supabase/migrations/          schema, RLS, RPC functions, taxonomy seed
supabase/tests/               SQL tests for RLS and RPCs
tests/e2e/demo.spec.ts        the demo script from MVP_PLAN.md, end to end
```

**Security model.** The database enforces the rules, not the UI:

- RLS is on for every table; API roles start with zero privileges and get column-level grants.
- Contact details (`worker_contacts`) are readable only after the employer shortlists the worker.
- Pipeline moves, hiring, joining confirmation and admin moderation only happen through `SECURITY DEFINER` functions (`set_application_status`, `hire_applicant`, `confirm_joining`, `end_placement`, `admin_*`). They check the caller and write `audit_logs`.
- Workers can only create `self_reported` history; `platform_verified` rows are created by `confirm_joining`.
- Owners can't set their own verification level or reopen a job an admin removed.

**Core flow.** application → (employer) shortlisted → interview → offered → hired (creates a *pending placement*) → (worker) confirms joining → placement *active* + Verified history; job auto-marked *filled* when active placements reach `openings`.

## 5. Team workflow

- `main` is protected: PR + 1 approval, no force-push. One short-lived branch per change (`feature/job-form`, `fix/apply-duplicate`), Conventional Commits (`feat: …`, `fix: …`).
- Only the DB owner edits `supabase/migrations/`. Add a **new** migration file for changes (`npx supabase migration new <name>`), never edit an applied one. Then `npm run db:reset && npm run db:types` and commit `types/database.ts`.
- New UI text goes into **both** `messages/en.json` and `messages/hi.json`; `npm run check:messages` catches gaps.

## 6. Features

- **Workers:** 3-step onboarding, profile with photo, self-reported + Verified work history, job search with filters (collapsible on phones), saved jobs, one-tap apply, pipeline tracker, interview details, joining confirmation, invites from owners, reviews of employers.
- **Owners:** business profile with photo and public page (`/b/[id]`), job posting with mandatory terms, "Still hiring" freshness, WhatsApp share, kanban applicant board, private notes, contact reveal on shortlist, hire → joining confirmation, team page, candidate search + invite to apply (30/day limit), reviews of workers and one reply per review.
- **Everyone:** in-app notifications (bell + `/notifications`, created by DB triggers), password reset by email, English/Hindi, "How it works" page with trust and safety rules and FAQ.
- **Admin:** business verification, report queue (jobs, businesses, workers, reviews), job removal, audit log.
- **Reviews:** open after a confirmed placement ends or after 30 days; worker reviews of businesses are public but anonymous (`business_reviews_public` view hides who wrote them).

## 7. Design system ("kitchen ticket")

- Tokens and component classes live in `app/globals.css`: paper/ink background, spice palette (masala primary, haldi accent, curry-leaf green for Verified, kokum for invites). Tailwind's stone/orange/green/yellow/blue/red scales are remapped to these tones.
- Fonts (`lib/fonts.ts`): Fraunces (display), Bricolage Grotesque (text), JetBrains Mono (ticket details), Rozha One + Mukta for Devanagari. Hindi pages drop letter-spacing and the mono font so conjuncts render correctly.
- Building blocks: `.ticket` + `.ticket-tear` (job cards, panels), `<Stamp>` (Verified), `.menu-row` (terms with dotted leaders), `<StatTile>`, chunky buttons with a hard shadow (`components/ui.tsx`).
- Phones: bottom tab bar for signed-in users (`components/nav.tsx`); everything is designed at 360–412 px first.

## 8. Not built yet (next steps)

- Email/WhatsApp delivery of notifications (needs Resend/WhatsApp Business API and a domain).
- Phone OTP login, reference checks, 30/90-day retention check-ins, account deletion.
- Terms of service and privacy policy pages (need legal review, don't copy from templates).
