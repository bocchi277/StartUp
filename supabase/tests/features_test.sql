-- Tests for migration 3. Runs after rls_test.sql and reuses its fixtures:
--   a = owner (Flavora Cafe), b = worker hired on job 1 (placement active, started today),
--   c = second worker, d = admin, f = other owner.
\set ON_ERROR_STOP 1
\set QUIET 1

-- ---------------------------------------------------------------- notifications from rls_test flow
do $$ begin
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-00000000000a' and type = 'new_applicant') = 1, 'owner: new_applicant';
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-00000000000a' and type = 'joined') = 1, 'owner: joined';
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-00000000000a' and type = 'business_verified') = 1, 'owner: business_verified';
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-00000000000b' and type = 'application_status') = 2, 'worker: shortlisted + interview';
  assert (select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-00000000000b' and type = 'hired') = 1, 'worker: hired';
  assert (select data ->> 'worker_name' from public.notifications where type = 'new_applicant' limit 1) = 'Ravi Kumar', 'notification data';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
do $$
declare n int;
begin
  assert (select count(*) from public.notifications) = 3, 'worker sees only own notifications';
  update public.notifications set read_at = now() where user_id = auth.uid();
  get diagnostics n = row_count;
  assert n = 3, 'mark own read';
  update public.notifications set read_at = now() where user_id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: marked someone else''s notification';
  begin
    update public.notifications set data = '{}' where user_id = auth.uid();
    raise exception 'FAIL: changed notification data';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.notify(auth.uid(), 'hired', '{}', '/w');
    raise exception 'FAIL: called notify directly';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  notifications created by triggers, private, only read_at writable'

-- ---------------------------------------------------------------- reviews
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
do $$ begin
  perform public.submit_review((select id from public.placements limit 1), 4, true, true, true, 'x');
  raise exception 'FAIL: reviewed on day one';
exception when others then
  assert sqlerrm = 'review_not_allowed_yet', sqlerrm;
end $$;
reset role;

-- Owner ends the placement -> both sides may review.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select public.end_placement((select id from public.placements limit 1), current_date, 'Moved back home');
select public.submit_review((select id from public.placements limit 1), 5, true, true, true, 'Reliable tandoor chef');
do $$ begin
  assert (select terms_matched from public.reviews where reviewer_side = 'employer') is null, 'employer review ignores worker-only fields';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select public.submit_review((select id from public.placements limit 1), 4, true, true, false, 'Good team, salary came a week late');
do $$ begin
  assert (select count(*) from public.notifications where type = 'placement_ended') = 1, 'worker told placement ended';
  begin
    perform public.submit_review((select id from public.placements limit 1), 1, false, false, false, 'again');
    raise exception 'FAIL: second review';
  exception when others then
    assert sqlerrm = 'already_reviewed', sqlerrm;
  end;
  assert (select count(*) from public.reviews) = 2, 'worker sees own review + review about them';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
do $$ begin
  begin
    perform public.submit_review((select id from public.placements limit 1), 1, false, false, false, 'fake');
    raise exception 'FAIL: outsider reviewed';
  exception when others then
    assert sqlerrm = 'not_allowed', sqlerrm;
  end;
  assert (select count(*) from public.reviews) = 0, 'worker c sees no reviews of worker b';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$ begin
  assert (select count(*) from public.business_reviews_public) = 1, 'anon sees business review';
  assert (select paid_on_time from public.business_reviews_public limit 1) = false, 'structured answers public';
  begin
    perform 1 from public.reviews;
    raise exception 'FAIL: anon read reviews table';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  assert not exists (
    select 1 from information_schema.columns
    where table_name = 'business_reviews_public' and column_name in ('worker_id', 'reviewer_id')
  ), 'public view hides reviewer identity';
end $$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$
declare v_worker_review uuid;
begin
  assert (select count(*) from public.reviews where reviewer_side = 'worker') = 0, 'owner cannot see who reviewed them';
  select id into v_worker_review from public.business_reviews_public limit 1;
  perform public.respond_to_review(v_worker_review, 'Sorry, we have fixed salary dates now');
  begin
    perform public.respond_to_review(v_worker_review, 'second reply');
    raise exception 'FAIL: replied twice';
  exception when others then
    assert sqlerrm = 'already_responded', sqlerrm;
  end;
  begin
    perform public.respond_to_review((select id from public.reviews where reviewer_side = 'employer'), 'reply to own review');
    raise exception 'FAIL: replied to own review';
  exception when others then
    assert sqlerrm = 'not_allowed', sqlerrm;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
select public.respond_to_review((select id from public.reviews where reviewer_side = 'employer'), 'Thank you!');
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.reviews) = 0, 'unrelated owner cannot see reviews of hidden worker';
end $$;
reset role;
\echo 'ok  reviews: eligibility, one per side, anonymous public view, single reply'

-- ---------------------------------------------------------------- invites + saved jobs
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
insert into public.worker_profiles (user_id, state, city, primary_role_id, open_to_work)
values (auth.uid(), 'Uttar Pradesh', 'Lucknow', 12, true);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
insert into public.jobs (business_id, role_id, title, salary_min, salary_max, pay_frequency,
  shift_start, shift_end, weekly_offs, meals, accommodation, deductions, employment_type, state, city, status)
select b.id, 12, 'Waiter', 12000, 15000, 'monthly', '12:00', '22:00', 1, 'two', false, 'None',
  'full_time', 'Uttar Pradesh', 'Lucknow', 'open'
from public.businesses b where b.owner_id = auth.uid();
reset role;
update public.jobs set id = '10000000-0000-0000-0000-000000000003' where title = 'Waiter';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select public.invite_worker('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c', 'We liked your profile');
do $$ begin
  begin
    perform public.invite_worker('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: invited twice';
  exception when others then
    assert sqlerrm = 'already_invited', sqlerrm;
  end;
  begin
    perform public.invite_worker('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: invited hidden worker';
  exception when others then
    assert sqlerrm = 'worker_not_available', sqlerrm;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
set role authenticated;
do $$ begin
  begin
    perform public.invite_worker('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: invited to someone else''s job';
  exception when others then
    assert sqlerrm = 'not_allowed', sqlerrm;
  end;
  assert (select count(*) from public.job_invites) = 0, 'other owner sees no invites';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
insert into public.saved_jobs (worker_id, job_id) values (auth.uid(), '10000000-0000-0000-0000-000000000003');
insert into public.applications (job_id, worker_id) values ('10000000-0000-0000-0000-000000000003', auth.uid());
select public.withdraw_application((select id from public.applications where worker_id = auth.uid()));
do $$ begin
  assert (select count(*) from public.job_invites) = 1, 'worker sees invite';
  assert (select count(*) from public.notifications where type = 'invited') = 1, 'worker notified of invite';
  assert (select count(*) from public.saved_jobs) = 1, 'saved job';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.notifications where type = 'application_withdrawn') = 1, 'owner told about withdrawal';
  assert (select count(*) from public.saved_jobs) = 0, 'owner cannot see saved jobs';
  begin
    insert into public.saved_jobs (worker_id, job_id) values (auth.uid(), '10000000-0000-0000-0000-000000000003');
    raise exception 'FAIL: employer saved a job';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  invites (ownership, availability, no duplicates), saved jobs, withdrawal notice'

-- ---------------------------------------------------------------- photos
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
update public.worker_profiles set photo_url = auth.uid() || '/avatar-1.jpg' where user_id = auth.uid();
insert into storage.objects (bucket_id, name) values ('avatars', auth.uid() || '/avatar-1.jpg');
do $$ begin
  begin
    update public.worker_profiles set photo_url = '00000000-0000-0000-0000-00000000000c/avatar.jpg' where user_id = auth.uid();
    raise exception 'FAIL: photo path in someone else''s folder';
  exception when check_violation then null;
  end;
  begin
    update public.worker_profiles set photo_url = 'https://evil.example/x.jpg' where user_id = auth.uid();
    raise exception 'FAIL: external photo url';
  exception when check_violation then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-00000000000c/x.jpg');
    raise exception 'FAIL: uploaded into another user''s folder';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  photos only in own storage folder'
\echo 'ALL FEATURE TESTS PASSED'
