-- =============================================================================
-- Hospitality hiring MVP: core schema, row level security, and RPC functions.
--
-- Security model in one paragraph:
--   * Every table has RLS enabled. Reads are controlled by policies.
--   * Simple writes (own profile, own business, own jobs, applying, notes,
--     self-reported history, reports) go through table grants + RLS.
--   * State changes that must follow rules (pipeline moves, hiring, joining
--     confirmation, admin moderation) are only possible through the
--     SECURITY DEFINER functions at the bottom of this file. They check the
--     caller, enforce the transition, and write audit logs.
--   * The service-role key is never needed by the app.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('worker', 'employer');
create type public.pay_frequency as enum ('monthly', 'weekly', 'daily');
create type public.shift_preference as enum ('morning', 'afternoon', 'evening', 'night', 'split', 'rotational', 'any');
create type public.employment_type as enum ('full_time', 'part_time', 'temporary', 'seasonal', 'contract');
create type public.business_category as enum ('cafe', 'restaurant', 'qsr', 'bakery', 'cloud_kitchen', 'hotel', 'catering', 'bar', 'other');
create type public.verification_level as enum ('unverified', 'email_verified', 'business_verified');
create type public.job_status as enum ('draft', 'open', 'paused', 'closed', 'filled', 'removed');
create type public.meals_provided as enum ('none', 'one', 'two', 'all');
create type public.application_status as enum ('applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn');
create type public.placement_status as enum ('pending', 'active', 'ended', 'cancelled');
create type public.history_source as enum ('self_reported', 'platform_verified');
create type public.report_target as enum ('job', 'business', 'worker');
create type public.report_reason as enum ('fake_job', 'wrong_terms', 'harassment', 'unpaid_wages', 'false_profile', 'spam', 'other');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- Generic updated_at trigger
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Taxonomy (seeded in the next migration, read-only for users)
-- -----------------------------------------------------------------------------
create table public.job_roles (
  id integer generated always as identity primary key,
  slug text not null unique,
  name_en text not null,
  name_hi text not null,
  category text not null check (category in ('kitchen', 'service', 'management', 'other')),
  sort_order integer not null default 0
);

create table public.cuisines (
  id integer generated always as identity primary key,
  slug text not null unique,
  name_en text not null,
  name_hi text not null,
  sort_order integer not null default 0
);

create table public.skills (
  id integer generated always as identity primary key,
  slug text not null unique,
  name_en text not null,
  name_hi text not null,
  category text not null check (category in ('kitchen', 'service', 'management', 'other')),
  sort_order integer not null default 0
);

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role,                       -- null until chosen (e.g. Google sign-up)
  is_admin boolean not null default false,    -- set manually in SQL, never by the app
  full_name text not null default '' check (char_length(full_name) <= 120),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.worker_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  photo_url text,
  headline text check (char_length(headline) <= 120),
  about text check (char_length(about) <= 1000),
  state text not null check (char_length(state) between 2 and 60),
  city text not null check (char_length(city) between 2 and 80),
  pincode text check (pincode ~ '^[1-9][0-9]{5}$'),
  primary_role_id integer not null references public.job_roles (id),
  secondary_role_ids integer[] not null default '{}',
  cuisine_ids integer[] not null default '{}',
  skill_ids integer[] not null default '{}',
  total_experience_months integer not null default 0 check (total_experience_months between 0 and 600),
  expected_salary_min integer check (expected_salary_min >= 0),
  expected_salary_max integer check (expected_salary_max >= 0),
  pay_frequency public.pay_frequency not null default 'monthly',
  preferred_shift public.shift_preference not null default 'any',
  employment_types public.employment_type[] not null default '{full_time}',
  languages_spoken text[] not null default '{}',
  open_to_work boolean not null default true,
  needs_accommodation boolean not null default false,
  willing_to_relocate boolean not null default false,
  available_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expected_salary_min is null or expected_salary_max is null or expected_salary_max >= expected_salary_min)
);
create trigger worker_profiles_updated_at before update on public.worker_profiles
  for each row execute function public.set_updated_at();
create index worker_profiles_search_idx on public.worker_profiles (state, city, primary_role_id) where open_to_work;
create index worker_profiles_cuisines_idx on public.worker_profiles using gin (cuisine_ids);
create index worker_profiles_skills_idx on public.worker_profiles using gin (skill_ids);

-- Kept apart from worker_profiles so RLS can hide it until the worker is shortlisted.
create table public.worker_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text check (phone ~ '^\+?[0-9]{10,13}$'),
  email text check (char_length(email) <= 254),
  whatsapp_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger worker_contacts_updated_at before update on public.worker_contacts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Businesses and jobs
-- -----------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade, -- one business per owner in the MVP
  name text not null check (char_length(name) between 2 and 120),
  category public.business_category not null,
  description text check (char_length(description) <= 1500),
  address text not null check (char_length(address) between 5 and 300),
  state text not null check (char_length(state) between 2 and 60),
  city text not null check (char_length(city) between 2 and 80),
  pincode text check (pincode ~ '^[1-9][0-9]{5}$'),
  phone text not null check (phone ~ '^\+?[0-9]{10,13}$'),
  photo_url text,
  verification_level public.verification_level not null default 'unverified',
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger businesses_updated_at before update on public.businesses
  for each row execute function public.set_updated_at();

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  role_id integer not null references public.job_roles (id),
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 3000),
  openings integer not null default 1 check (openings between 1 and 100),
  min_experience_months integer not null default 0 check (min_experience_months between 0 and 600),
  -- Mandatory job terms (HMW 3): a job cannot exist without these.
  salary_min integer not null check (salary_min > 0),
  salary_max integer not null,
  pay_frequency public.pay_frequency not null,
  shift_start time not null,
  shift_end time not null,                    -- may be earlier than shift_start for night shifts
  weekly_offs numeric(2, 1) not null check (weekly_offs in (0, 0.5, 1, 1.5, 2)),
  meals public.meals_provided not null,
  accommodation boolean not null,
  tips_info text check (char_length(tips_info) <= 300),
  deductions text not null check (char_length(btrim(deductions)) between 1 and 500),
  employment_type public.employment_type not null,
  joining_date date,
  state text not null check (char_length(state) between 2 and 60),
  city text not null check (char_length(city) between 2 and 80),
  cuisine_ids integer[] not null default '{}',
  skill_ids integer[] not null default '{}',
  status public.job_status not null default 'draft',
  last_confirmed_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_max >= salary_min)
);
create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();
create index jobs_search_idx on public.jobs (status, state, city, role_id, expires_at);
create index jobs_business_idx on public.jobs (business_id);
create index jobs_cuisines_idx on public.jobs using gin (cuisine_ids);

-- -----------------------------------------------------------------------------
-- Hiring
-- -----------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'applied',
  cover_note text check (char_length(cover_note) <= 500),
  interview_at timestamptz,
  interview_note text check (char_length(interview_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, worker_id)                   -- one application per job per worker
);
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();
create index applications_worker_idx on public.applications (worker_id);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index application_notes_app_idx on public.application_notes (application_id);

-- An application is not proof of employment. A placement is created when the
-- employer hires, and becomes "active" only when the worker confirms joining.
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  agreed_salary integer not null check (agreed_salary > 0),
  agreed_pay_frequency public.pay_frequency not null,
  start_date date not null,
  employer_confirmed_at timestamptz,
  worker_confirmed_at timestamptz,
  status public.placement_status not null default 'pending',
  end_date date,
  exit_reason text check (char_length(exit_reason) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger placements_updated_at before update on public.placements
  for each row execute function public.set_updated_at();
create index placements_business_idx on public.placements (business_id);
create index placements_worker_idx on public.placements (worker_id);

create table public.employment_history (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.profiles (id) on delete cascade,
  employer_name text not null check (char_length(employer_name) between 2 and 120),
  business_id uuid references public.businesses (id) on delete set null,
  role_id integer references public.job_roles (id),
  job_title text check (char_length(job_title) <= 120),
  start_date date not null,
  end_date date,
  reason_for_leaving text check (char_length(reason_for_leaving) <= 500),
  source public.history_source not null default 'self_reported',
  placement_id uuid unique references public.placements (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);
create trigger employment_history_updated_at before update on public.employment_history
  for each row execute function public.set_updated_at();
create index employment_history_worker_idx on public.employment_history (worker_id);

-- -----------------------------------------------------------------------------
-- Trust and admin
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  admin_note text check (char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index reports_status_idx on public.reports (status, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- =============================================================================
-- Helper functions used by RLS policies.
-- SECURITY DEFINER so they can look across tables without recursive RLS.
-- They only ever answer questions about the current caller (auth.uid()).
-- =============================================================================
create function public.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create function public.my_role()
returns public.app_role language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create function public.owns_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
  );
$$;

create function public.owns_job(p_job_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.jobs j
    join public.businesses b on b.id = j.business_id
    where j.id = p_job_id and b.owner_id = auth.uid()
  );
$$;

create function public.owns_application(p_application_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.businesses b on b.id = j.business_id
    where a.id = p_application_id and b.owner_id = auth.uid()
  );
$$;

create function public.has_applied_to_job(p_job_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.applications a
    where a.job_id = p_job_id and a.worker_id = auth.uid()
  );
$$;

create function public.job_is_open(p_job_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.jobs j
    where j.id = p_job_id and j.status = 'open' and j.expires_at > now()
  );
$$;

-- Who may see a worker's profile, skills and work history:
-- the worker, admins, and employers when the worker is open to work
-- or has applied to one of that employer's jobs.
create function public.can_view_worker(p_worker_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(
    p_worker_id = auth.uid()
    or public.is_admin()
    or (
      public.my_role() = 'employer'
      and (
        exists (
          select 1 from public.worker_profiles wp
          where wp.user_id = p_worker_id and wp.open_to_work
        )
        or exists (
          select 1 from public.applications a
          join public.jobs j on j.id = a.job_id
          join public.businesses b on b.id = j.business_id
          where a.worker_id = p_worker_id and b.owner_id = auth.uid()
        )
      )
    ),
    false
  );
$$;

-- Contact details: only after the employer has shortlisted the worker.
create function public.can_view_worker_contacts(p_worker_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(
    p_worker_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.businesses b on b.id = j.business_id
      where a.worker_id = p_worker_id
        and b.owner_id = auth.uid()
        and a.status in ('shortlisted', 'interview', 'offered', 'hired')
    ),
    false
  );
$$;

-- =============================================================================
-- Triggers with business rules
-- =============================================================================

-- Create a profile row for every new auth user. Role comes from sign-up
-- metadata when present (email sign-up); Google users choose it in onboarding.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_role public.app_role;
  v_lang text;
begin
  if new.raw_user_meta_data ->> 'role' in ('worker', 'employer') then
    v_role := (new.raw_user_meta_data ->> 'role')::public.app_role;
  end if;
  v_lang := case when new.raw_user_meta_data ->> 'preferred_language' = 'hi' then 'hi' else 'en' end;

  insert into public.profiles (id, role, full_name, preferred_language)
  values (
    new.id,
    v_role,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    ), 120),
    v_lang
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A business gets "email_verified" automatically when its owner's email is confirmed.
create function public.businesses_set_initial_verification()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.verification_level := 'unverified';
  new.verified_at := null;
  new.verified_by := null;
  if exists (
    select 1 from auth.users u
    where u.id = new.owner_id and u.email_confirmed_at is not null
  ) then
    new.verification_level := 'email_verified';
  end if;
  return new;
end;
$$;

create trigger businesses_initial_verification
  before insert on public.businesses
  for each row execute function public.businesses_set_initial_verification();

-- Job status rules:
--   * only admins can set or leave "removed", and owners cannot edit a removed job
--   * re-opening a job refreshes its 30-day expiry
create function public.jobs_guard_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    if old.status = 'removed' then
      raise exception 'job_removed_by_admin' using errcode = 'P0001';
    end if;
    if new.status = 'removed' then
      raise exception 'only_admin_can_remove' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'open' and old.status is distinct from 'open' then
    new.last_confirmed_at := now();
    new.expires_at := now() + interval '30 days';
  end if;
  return new;
end;
$$;

create trigger jobs_guard_status
  before update on public.jobs
  for each row execute function public.jobs_guard_status();

-- =============================================================================
-- Row level security
-- =============================================================================
alter table public.job_roles enable row level security;
alter table public.cuisines enable row level security;
alter table public.skills enable row level security;
alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.worker_contacts enable row level security;
alter table public.businesses enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_notes enable row level security;
alter table public.placements enable row level security;
alter table public.employment_history enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- Start from zero privileges for API roles, then grant exactly what is needed.
revoke all on all tables in schema public from anon, authenticated;

-- Taxonomy: public read
grant select on public.job_roles, public.cuisines, public.skills to anon, authenticated;
create policy "taxonomy readable" on public.job_roles for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.cuisines for select to anon, authenticated using (true);
create policy "taxonomy readable" on public.skills for select to anon, authenticated using (true);

-- profiles
grant select on public.profiles to authenticated;
grant update (full_name, preferred_language, onboarding_complete) on public.profiles to authenticated;
create policy "profiles select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.can_view_worker(id));
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- worker_profiles
grant select, insert, update on public.worker_profiles to authenticated;
create policy "worker_profiles select" on public.worker_profiles for select to authenticated
  using (public.can_view_worker(user_id));
create policy "worker_profiles insert own" on public.worker_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and public.my_role() = 'worker');
create policy "worker_profiles update own" on public.worker_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- worker_contacts
grant select, insert, update on public.worker_contacts to authenticated;
create policy "worker_contacts select" on public.worker_contacts for select to authenticated
  using (public.can_view_worker_contacts(user_id));
create policy "worker_contacts insert own" on public.worker_contacts for insert to authenticated
  with check (user_id = (select auth.uid()) and public.my_role() = 'worker');
create policy "worker_contacts update own" on public.worker_contacts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- businesses: public read; owners cannot touch verification columns
grant select on public.businesses to anon, authenticated;
grant insert (owner_id, name, category, description, address, state, city, pincode, phone, photo_url)
  on public.businesses to authenticated;
grant update (name, category, description, address, state, city, pincode, phone, photo_url)
  on public.businesses to authenticated;
create policy "businesses readable" on public.businesses for select to anon, authenticated using (true);
create policy "businesses insert own" on public.businesses for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.my_role() = 'employer');
create policy "businesses update own" on public.businesses for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- jobs: open + unexpired jobs are public; owners see all of theirs;
-- workers keep seeing jobs they applied to after they close.
grant select on public.jobs to anon, authenticated;
grant insert (business_id, role_id, title, description, openings, min_experience_months,
              salary_min, salary_max, pay_frequency, shift_start, shift_end, weekly_offs,
              meals, accommodation, tips_info, deductions, employment_type, joining_date,
              state, city, cuisine_ids, skill_ids, status)
  on public.jobs to authenticated;
grant update (role_id, title, description, openings, min_experience_months,
              salary_min, salary_max, pay_frequency, shift_start, shift_end, weekly_offs,
              meals, accommodation, tips_info, deductions, employment_type, joining_date,
              state, city, cuisine_ids, skill_ids, status, last_confirmed_at, expires_at)
  on public.jobs to authenticated;
create policy "jobs select" on public.jobs for select to anon, authenticated
  using (
    (status = 'open' and expires_at > now())
    or public.owns_business(business_id)
    or public.has_applied_to_job(id)
    or public.is_admin()
  );
create policy "jobs insert own business" on public.jobs for insert to authenticated
  with check (public.owns_business(business_id) and status in ('draft', 'open'));
create policy "jobs update own business" on public.jobs for update to authenticated
  using (public.owns_business(business_id))
  with check (
    public.owns_business(business_id)
    and expires_at <= now() + interval '31 days'   -- owners can refresh, not extend forever
  );

-- applications: workers apply to open jobs; all status changes go through RPCs
grant select on public.applications to authenticated;
grant insert (job_id, worker_id, cover_note) on public.applications to authenticated;
create policy "applications select" on public.applications for select to authenticated
  using (worker_id = (select auth.uid()) or public.owns_job(job_id) or public.is_admin());
create policy "applications insert own" on public.applications for insert to authenticated
  with check (
    worker_id = (select auth.uid())
    and public.my_role() = 'worker'
    and public.job_is_open(job_id)
  );

-- application_notes: private to the hiring business
grant select, delete on public.application_notes to authenticated;
grant insert (application_id, body) on public.application_notes to authenticated;
create policy "notes select" on public.application_notes for select to authenticated
  using (public.owns_application(application_id));
create policy "notes insert" on public.application_notes for insert to authenticated
  with check (author_id = (select auth.uid()) and public.owns_application(application_id));
create policy "notes delete own" on public.application_notes for delete to authenticated
  using (author_id = (select auth.uid()));

-- placements: read-only through the API; changed by RPCs
grant select on public.placements to authenticated;
create policy "placements select" on public.placements for select to authenticated
  using (worker_id = (select auth.uid()) or public.owns_business(business_id) or public.is_admin());

-- employment_history: workers manage only self-reported rows
grant select, delete on public.employment_history to authenticated;
grant insert (worker_id, employer_name, role_id, job_title, start_date, end_date, reason_for_leaving)
  on public.employment_history to authenticated;
grant update (employer_name, role_id, job_title, start_date, end_date, reason_for_leaving)
  on public.employment_history to authenticated;
create policy "history select" on public.employment_history for select to authenticated
  using (public.can_view_worker(worker_id));
create policy "history insert own" on public.employment_history for insert to authenticated
  with check (worker_id = (select auth.uid()) and source = 'self_reported' and public.my_role() = 'worker');
create policy "history update own self-reported" on public.employment_history for update to authenticated
  using (worker_id = (select auth.uid()) and source = 'self_reported')
  with check (worker_id = (select auth.uid()) and source = 'self_reported');
create policy "history delete own self-reported" on public.employment_history for delete to authenticated
  using (worker_id = (select auth.uid()) and source = 'self_reported');

-- reports
grant select on public.reports to authenticated;
grant insert (target_type, target_id, reason, details) on public.reports to authenticated;
create policy "reports select" on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or public.is_admin());
create policy "reports insert" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- audit_logs: admins read; only SECURITY DEFINER functions write
grant select on public.audit_logs to authenticated;
create policy "audit select admin" on public.audit_logs for select to authenticated
  using (public.is_admin());

-- =============================================================================
-- RPC functions (called with supabase.rpc(...))
-- =============================================================================
create function public.write_audit(p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb default '{}')
returns void language sql security definer set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'));
$$;

-- Choose role once (for Google sign-ups that skipped the role step).
create function public.set_my_role(p_role public.app_role)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  update public.profiles set role = p_role where id = auth.uid() and role is null;
  if not found then
    raise exception 'role_already_set' using errcode = 'P0001';
  end if;
end;
$$;

-- Employer moves an application through the pipeline (not to "hired"; use hire_applicant).
create function public.set_application_status(
  p_application_id uuid,
  p_status public.application_status,
  p_interview_at timestamptz default null,
  p_interview_note text default null
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_current public.application_status;
begin
  if not public.owns_application(p_application_id) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if p_status not in ('shortlisted', 'interview', 'offered', 'rejected') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select a.status into v_current from public.applications a where a.id = p_application_id for update;
  if v_current in ('withdrawn', 'hired') then
    raise exception 'application_closed' using errcode = 'P0001';
  end if;
  if p_status = 'interview' and p_interview_at is null then
    raise exception 'interview_time_required' using errcode = 'P0001';
  end if;

  update public.applications
  set status = p_status,
      interview_at = case when p_status = 'interview' then p_interview_at else interview_at end,
      interview_note = case when p_status = 'interview' then left(p_interview_note, 500) else interview_note end
  where id = p_application_id;
end;
$$;

-- Worker withdraws their own application.
create function public.withdraw_application(p_application_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.applications
  set status = 'withdrawn'
  where id = p_application_id
    and worker_id = auth.uid()
    and status in ('applied', 'shortlisted', 'interview', 'offered');
  if not found then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
end;
$$;

-- Employer marks an applicant as hired with the agreed terms.
create function public.hire_applicant(
  p_application_id uuid,
  p_agreed_salary integer,
  p_pay_frequency public.pay_frequency,
  p_start_date date
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_app record;
  v_placement_id uuid;
begin
  if not public.owns_application(p_application_id) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if p_agreed_salary is null or p_agreed_salary <= 0 or p_start_date is null then
    raise exception 'invalid_terms' using errcode = 'P0001';
  end if;

  select a.id, a.status, a.worker_id, a.job_id, j.business_id
  into v_app
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = p_application_id
  for update of a;

  if v_app.status in ('withdrawn', 'rejected', 'hired') then
    raise exception 'application_closed' using errcode = 'P0001';
  end if;

  update public.applications set status = 'hired' where id = p_application_id;

  insert into public.placements (
    application_id, worker_id, business_id, job_id,
    agreed_salary, agreed_pay_frequency, start_date, employer_confirmed_at
  ) values (
    p_application_id, v_app.worker_id, v_app.business_id, v_app.job_id,
    p_agreed_salary, p_pay_frequency, p_start_date, now()
  )
  returning id into v_placement_id;

  perform public.write_audit('placement.created', 'placement', v_placement_id,
    jsonb_build_object('agreed_salary', p_agreed_salary, 'start_date', p_start_date));
  return v_placement_id;
end;
$$;

-- Worker confirms they actually joined. Creates the platform-verified history entry.
create function public.confirm_joining(p_placement_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_p record;
  v_active integer;
begin
  select pl.id, pl.worker_id, pl.business_id, pl.job_id, pl.start_date, pl.status,
         b.name as business_name, j.role_id, j.title, j.openings, j.status as job_status
  into v_p
  from public.placements pl
  join public.businesses b on b.id = pl.business_id
  join public.jobs j on j.id = pl.job_id
  where pl.id = p_placement_id
  for update of pl;

  if not found or v_p.worker_id is distinct from auth.uid() then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if v_p.status <> 'pending' then
    raise exception 'placement_not_pending' using errcode = 'P0001';
  end if;

  update public.placements
  set worker_confirmed_at = now(), status = 'active'
  where id = p_placement_id;

  insert into public.employment_history (
    worker_id, employer_name, business_id, role_id, job_title, start_date, source, placement_id
  ) values (
    v_p.worker_id, v_p.business_name, v_p.business_id, v_p.role_id, v_p.title,
    v_p.start_date, 'platform_verified', v_p.id
  );

  select count(*) into v_active
  from public.placements pl
  where pl.job_id = v_p.job_id and pl.status = 'active';

  if v_active >= v_p.openings and v_p.job_status in ('open', 'paused') then
    update public.jobs set status = 'filled' where id = v_p.job_id;
  end if;

  perform public.write_audit('placement.confirmed', 'placement', v_p.id, '{}');
end;
$$;

-- Either side ends a placement. Pending -> cancelled; active -> ended (history gets the end date).
create function public.end_placement(p_placement_id uuid, p_end_date date, p_reason text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_p record;
begin
  select pl.id, pl.worker_id, pl.business_id, pl.status, pl.start_date
  into v_p
  from public.placements pl
  where pl.id = p_placement_id
  for update;

  if not found or not (v_p.worker_id is not distinct from auth.uid() or public.owns_business(v_p.business_id)) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;

  if v_p.status = 'pending' then
    update public.placements set status = 'cancelled', exit_reason = left(p_reason, 500)
    where id = p_placement_id;
  elsif v_p.status = 'active' then
    if p_end_date is null or p_end_date < v_p.start_date then
      raise exception 'invalid_end_date' using errcode = 'P0001';
    end if;
    update public.placements
    set status = 'ended', end_date = p_end_date, exit_reason = left(p_reason, 500)
    where id = p_placement_id;
    update public.employment_history
    set end_date = p_end_date, reason_for_leaving = left(p_reason, 500)
    where placement_id = p_placement_id;
  else
    raise exception 'placement_closed' using errcode = 'P0001';
  end if;

  perform public.write_audit('placement.ended', 'placement', p_placement_id,
    jsonb_build_object('from_status', v_p.status, 'end_date', p_end_date));
end;
$$;

-- ----- Admin RPCs ------------------------------------------------------------
create function public.admin_set_business_verification(p_business_id uuid, p_level public.verification_level)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_old public.verification_level;
begin
  if not public.is_admin() then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  select verification_level into v_old from public.businesses where id = p_business_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  update public.businesses
  set verification_level = p_level,
      verified_at = case when p_level = 'business_verified' then now() else null end,
      verified_by = case when p_level = 'business_verified' then auth.uid() else null end
  where id = p_business_id;

  perform public.write_audit('business.verification_changed', 'business', p_business_id,
    jsonb_build_object('from', v_old, 'to', p_level));
end;
$$;

create function public.admin_update_report(p_report_id uuid, p_status public.report_status, p_note text default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_old public.report_status;
begin
  if not public.is_admin() then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  select status into v_old from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  update public.reports
  set status = p_status,
      admin_note = coalesce(left(p_note, 1000), admin_note),
      resolved_at = case when p_status in ('resolved', 'dismissed') then now() else null end
  where id = p_report_id;

  perform public.write_audit('report.status_changed', 'report', p_report_id,
    jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note));
end;
$$;

create function public.admin_set_job_status(p_job_id uuid, p_status public.job_status)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_old public.job_status;
begin
  if not public.is_admin() then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  select status into v_old from public.jobs where id = p_job_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  update public.jobs set status = p_status where id = p_job_id;

  perform public.write_audit('job.status_changed', 'job', p_job_id,
    jsonb_build_object('from', v_old, 'to', p_status));
end;
$$;

-- Function privileges: RLS helpers stay callable by everyone (policies need them).
-- Mutating RPCs are for signed-in users only. write_audit and trigger
-- functions are internal.
revoke execute on function public.write_audit(text, text, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.businesses_set_initial_verification() from public, anon, authenticated;
revoke execute on function public.jobs_guard_status() from public, anon, authenticated;

revoke execute on function public.set_my_role(public.app_role) from public, anon;
revoke execute on function public.set_application_status(uuid, public.application_status, timestamptz, text) from public, anon;
revoke execute on function public.withdraw_application(uuid) from public, anon;
revoke execute on function public.hire_applicant(uuid, integer, public.pay_frequency, date) from public, anon;
revoke execute on function public.confirm_joining(uuid) from public, anon;
revoke execute on function public.end_placement(uuid, date, text) from public, anon;
revoke execute on function public.admin_set_business_verification(uuid, public.verification_level) from public, anon;
revoke execute on function public.admin_update_report(uuid, public.report_status, text) from public, anon;
revoke execute on function public.admin_set_job_status(uuid, public.job_status) from public, anon;

grant execute on function public.set_my_role(public.app_role) to authenticated;
grant execute on function public.set_application_status(uuid, public.application_status, timestamptz, text) to authenticated;
grant execute on function public.withdraw_application(uuid) to authenticated;
grant execute on function public.hire_applicant(uuid, integer, public.pay_frequency, date) to authenticated;
grant execute on function public.confirm_joining(uuid) to authenticated;
grant execute on function public.end_placement(uuid, date, text) to authenticated;
grant execute on function public.admin_set_business_verification(uuid, public.verification_level) to authenticated;
grant execute on function public.admin_update_report(uuid, public.report_status, text) to authenticated;
grant execute on function public.admin_set_job_status(uuid, public.job_status) to authenticated;
