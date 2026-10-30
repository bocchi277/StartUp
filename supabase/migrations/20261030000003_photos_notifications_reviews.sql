-- =============================================================================
-- Migration 3: photos, notifications, saved jobs, job invites, mutual reviews.
-- Same rules as before: RLS everywhere, writes with business rules go through
-- SECURITY DEFINER functions, notifications are only created by triggers.
-- =============================================================================

-- Used only by the report form; not referenced elsewhere in this migration
-- (a new enum value can't be used in the transaction that adds it).
alter type public.report_target add value if not exists 'review';

-- -----------------------------------------------------------------------------
-- Photos (Supabase Storage). Files live under "<user id>/<file>".
-- The tables store only that path, never a full URL, so nobody can point a
-- profile picture at an outside server.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('business-photos', 'business-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "photos: read own folder" on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'business-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'business-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'business-photos') and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.worker_profiles
  add constraint worker_photo_path check (
    photo_url is null
    or (photo_url ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$' and split_part(photo_url, '/', 1) = user_id::text)
  );
alter table public.businesses
  add constraint business_photo_path check (
    photo_url is null
    or (photo_url ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$' and split_part(photo_url, '/', 1) = owner_id::text)
  );

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create type public.notification_type as enum (
  'new_applicant', 'application_status', 'application_withdrawn', 'hired', 'joined',
  'placement_ended', 'invited', 'review_received', 'business_verified'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  data jsonb not null default '{}',     -- values for the translated message
  link text check (link ~ '^/[A-Za-z0-9/_?=&.-]*$'),  -- path without locale
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "notifications own" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.notify(p_user uuid, p_type public.notification_type, p_data jsonb, p_link text)
returns void language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, type, data, link)
  select p_user, p_type, coalesce(p_data, '{}'), p_link
  where p_user is not null;
$$;

-- Applications: new applicant -> owner; status change -> worker; withdrawal -> owner.
create function public.applications_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v record;
begin
  select j.title as job_title, b.owner_id, b.name as business_name, p.full_name as worker_name
  into v
  from public.jobs j
  join public.businesses b on b.id = j.business_id
  join public.profiles p on p.id = new.worker_id
  where j.id = new.job_id;

  if tg_op = 'INSERT' then
    perform public.notify(v.owner_id, 'new_applicant',
      jsonb_build_object('job_title', v.job_title, 'worker_name', v.worker_name),
      '/e/applications/' || new.id);
  elsif new.status is distinct from old.status
     or (new.status = 'interview' and new.interview_at is distinct from old.interview_at) then
    if new.status in ('shortlisted', 'interview', 'offered', 'rejected') then
      perform public.notify(new.worker_id, 'application_status',
        jsonb_build_object('job_title', v.job_title, 'business_name', v.business_name, 'status', new.status),
        '/w/applications');
    elsif new.status = 'withdrawn' then
      perform public.notify(v.owner_id, 'application_withdrawn',
        jsonb_build_object('job_title', v.job_title, 'worker_name', v.worker_name),
        '/e/applications/' || new.id);
    end if;
  end if;
  return null;
end;
$$;
create trigger applications_notify after insert or update on public.applications
  for each row execute function public.applications_notify();

-- Placements: hired -> worker; joined -> owner; ended/cancelled -> the other side.
create function public.placements_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v record;
  v_data jsonb;
begin
  select j.title as job_title, b.owner_id, b.name as business_name, p.full_name as worker_name
  into v
  from public.jobs j
  join public.businesses b on b.id = j.business_id
  join public.profiles p on p.id = new.worker_id
  where j.id = new.job_id;
  v_data := jsonb_build_object('job_title', v.job_title, 'business_name', v.business_name, 'worker_name', v.worker_name);

  if tg_op = 'INSERT' then
    perform public.notify(new.worker_id, 'hired', v_data, '/w/applications');
  elsif new.status is distinct from old.status then
    if new.status = 'active' then
      perform public.notify(v.owner_id, 'joined', v_data, '/e/team');
    elsif new.status in ('ended', 'cancelled') then
      if auth.uid() is not distinct from new.worker_id then
        perform public.notify(v.owner_id, 'placement_ended', v_data, '/e/team');
      else
        perform public.notify(new.worker_id, 'placement_ended', v_data, '/w/applications');
      end if;
    end if;
  end if;
  return null;
end;
$$;
create trigger placements_notify after insert or update on public.placements
  for each row execute function public.placements_notify();

create function public.businesses_notify()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.verification_level = 'business_verified' and old.verification_level is distinct from 'business_verified' then
    perform public.notify(new.owner_id, 'business_verified', jsonb_build_object('business_name', new.name), '/e/business');
  end if;
  return null;
end;
$$;
create trigger businesses_notify after update of verification_level on public.businesses
  for each row execute function public.businesses_notify();

-- -----------------------------------------------------------------------------
-- Saved jobs (worker bookmarks)
-- -----------------------------------------------------------------------------
create table public.saved_jobs (
  worker_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (worker_id, job_id)
);
alter table public.saved_jobs enable row level security;
revoke all on public.saved_jobs from anon, authenticated;
grant select, delete on public.saved_jobs to authenticated;
grant insert (worker_id, job_id) on public.saved_jobs to authenticated;
create policy "saved own" on public.saved_jobs for select to authenticated
  using (worker_id = (select auth.uid()));
create policy "saved insert" on public.saved_jobs for insert to authenticated
  with check (worker_id = (select auth.uid()) and public.my_role() = 'worker');
create policy "saved delete" on public.saved_jobs for delete to authenticated
  using (worker_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Job invites: an employer asks an open-to-work worker to apply.
-- -----------------------------------------------------------------------------
create table public.job_invites (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  message text check (char_length(message) <= 300),
  created_at timestamptz not null default now(),
  unique (job_id, worker_id)
);
create index job_invites_worker_idx on public.job_invites (worker_id, created_at desc);
create index job_invites_business_idx on public.job_invites (business_id, created_at desc);
alter table public.job_invites enable row level security;
revoke all on public.job_invites from anon, authenticated;
grant select on public.job_invites to authenticated;
create policy "invites visible to both sides" on public.job_invites for select to authenticated
  using (worker_id = (select auth.uid()) or public.owns_business(business_id) or public.is_admin());

create function public.invite_worker(p_job_id uuid, p_worker_id uuid, p_message text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_job record;
  v_id uuid;
begin
  select j.id, j.title, j.business_id, b.name as business_name
  into v_job
  from public.jobs j join public.businesses b on b.id = j.business_id
  where j.id = p_job_id and b.owner_id = auth.uid() and j.status = 'open' and j.expires_at > now();
  if not found then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.worker_profiles wp join public.profiles p on p.id = wp.user_id
    where wp.user_id = p_worker_id and wp.open_to_work and p.role = 'worker'
  ) then
    raise exception 'worker_not_available' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.applications a where a.job_id = p_job_id and a.worker_id = p_worker_id) then
    raise exception 'already_applied' using errcode = 'P0001';
  end if;
  -- Spam protection: at most 30 invites per business per day.
  if (select count(*) from public.job_invites i
      where i.business_id = v_job.business_id and i.created_at > now() - interval '1 day') >= 30 then
    raise exception 'invite_limit' using errcode = 'P0001';
  end if;

  insert into public.job_invites (job_id, business_id, worker_id, message)
  values (p_job_id, v_job.business_id, p_worker_id, left(nullif(btrim(p_message), ''), 300))
  returning id into v_id;

  perform public.notify(p_worker_id, 'invited',
    jsonb_build_object('job_title', v_job.title, 'business_name', v_job.business_name),
    '/jobs/' || p_job_id);
  return v_id;
exception when unique_violation then
  raise exception 'already_invited' using errcode = 'P0001';
end;
$$;

-- -----------------------------------------------------------------------------
-- Reviews: both sides rate each other after a confirmed placement has ended,
-- or after 30 days of working. One review per side per placement. The person
-- reviewed can reply once (the dispute path), and anyone can report a review.
-- -----------------------------------------------------------------------------
create type public.review_side as enum ('worker', 'employer');  -- who wrote it

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references public.placements (id) on delete cascade,
  reviewer_side public.review_side not null,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  worker_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  would_return boolean not null,        -- worker: would work here again / employer: would rehire
  terms_matched boolean,                -- worker reviews only: were the posted terms honoured?
  paid_on_time boolean,                 -- worker reviews only
  comment text check (char_length(comment) <= 1000),
  response text check (char_length(response) <= 1000),
  response_at timestamptz,
  created_at timestamptz not null default now(),
  unique (placement_id, reviewer_side),
  check (reviewer_side = 'worker' or (terms_matched is null and paid_on_time is null))
);
create index reviews_business_idx on public.reviews (business_id, created_at desc);
create index reviews_worker_idx on public.reviews (worker_id, created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to authenticated;
-- Reviews of workers: visible to people who may see that worker.
-- Reviews of businesses: only through business_reviews_public (no reviewer identity).
create policy "reviews select" on public.reviews for select to authenticated
  using (
    reviewer_id = (select auth.uid())
    or (reviewer_side = 'employer' and (public.can_view_worker(worker_id) or public.owns_business(business_id)))
    or public.is_admin()
  );

-- Anonymous view of what workers said about a business. Runs with the view
-- owner's rights on purpose, so it can hide worker_id and reviewer_id.
create view public.business_reviews_public with (security_invoker = false) as
  select r.id, r.business_id, r.rating, r.would_return, r.terms_matched, r.paid_on_time,
         r.comment, r.response, r.response_at, r.created_at, j.role_id
  from public.reviews r
  join public.placements pl on pl.id = r.placement_id
  join public.jobs j on j.id = pl.job_id
  where r.reviewer_side = 'worker';
revoke all on public.business_reviews_public from anon, authenticated;
grant select on public.business_reviews_public to anon, authenticated;

create function public.submit_review(
  p_placement_id uuid,
  p_rating integer,
  p_would_return boolean,
  p_terms_matched boolean default null,
  p_paid_on_time boolean default null,
  p_comment text default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_pl record;
  v_side public.review_side;
  v_id uuid;
  v_owner uuid;
begin
  select pl.*, b.owner_id into v_pl
  from public.placements pl join public.businesses b on b.id = pl.business_id
  where pl.id = p_placement_id;
  if not found then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;

  if v_pl.worker_id is not distinct from auth.uid() then
    v_side := 'worker';
  elsif v_pl.owner_id is not distinct from auth.uid() then
    v_side := 'employer';
  else
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;

  if v_pl.worker_confirmed_at is null
     or v_pl.status not in ('active', 'ended')
     or (v_pl.status = 'active' and v_pl.start_date > current_date - 30) then
    raise exception 'review_not_allowed_yet' using errcode = 'P0001';
  end if;
  if p_rating is null or p_rating not between 1 and 5 or p_would_return is null then
    raise exception 'invalid_review' using errcode = 'P0001';
  end if;

  insert into public.reviews (
    placement_id, reviewer_side, reviewer_id, worker_id, business_id,
    rating, would_return, terms_matched, paid_on_time, comment
  ) values (
    p_placement_id, v_side, auth.uid(), v_pl.worker_id, v_pl.business_id,
    p_rating, p_would_return,
    case when v_side = 'worker' then p_terms_matched end,
    case when v_side = 'worker' then p_paid_on_time end,
    left(nullif(btrim(p_comment), ''), 1000)
  ) returning id into v_id;

  perform public.notify(
    case when v_side = 'worker' then v_pl.owner_id else v_pl.worker_id end,
    'review_received',
    jsonb_build_object('rating', p_rating),
    case when v_side = 'worker' then '/e/business' else '/w/profile' end
  );
  return v_id;
exception when unique_violation then
  raise exception 'already_reviewed' using errcode = 'P0001';
end;
$$;

-- The person reviewed may reply once.
create function public.respond_to_review(p_review_id uuid, p_response text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v record;
begin
  select r.id, r.reviewer_side, r.worker_id, r.business_id, r.response into v
  from public.reviews r where r.id = p_review_id for update;
  if not found
     or not ((v.reviewer_side = 'worker' and public.owns_business(v.business_id))
             or (v.reviewer_side = 'employer' and v.worker_id is not distinct from auth.uid())) then
    raise exception 'not_allowed' using errcode = 'P0001';
  end if;
  if v.response is not null then
    raise exception 'already_responded' using errcode = 'P0001';
  end if;
  if char_length(btrim(coalesce(p_response, ''))) = 0 then
    raise exception 'invalid_review' using errcode = 'P0001';
  end if;

  update public.reviews set response = left(btrim(p_response), 1000), response_at = now()
  where id = p_review_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- -----------------------------------------------------------------------------
revoke execute on function public.notify(uuid, public.notification_type, jsonb, text) from public, anon, authenticated;
revoke execute on function public.applications_notify() from public, anon, authenticated;
revoke execute on function public.placements_notify() from public, anon, authenticated;
revoke execute on function public.businesses_notify() from public, anon, authenticated;

revoke execute on function public.invite_worker(uuid, uuid, text) from public, anon;
revoke execute on function public.submit_review(uuid, integer, boolean, boolean, boolean, text) from public, anon;
revoke execute on function public.respond_to_review(uuid, text) from public, anon;
grant execute on function public.invite_worker(uuid, uuid, text) to authenticated;
grant execute on function public.submit_review(uuid, integer, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.respond_to_review(uuid, text) to authenticated;
