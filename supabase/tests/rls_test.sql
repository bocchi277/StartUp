-- Integration tests for RLS policies and RPC functions.
-- Run with supabase/tests/run.sh (plain Postgres + stub_supabase.sql).
-- Each block raises an exception on failure, so ON_ERROR_STOP aborts the run.
\set ON_ERROR_STOP 1
\set QUIET 1

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.in',   now(), '{"role":"employer","full_name":"Nishant Gupta"}'),
  ('00000000-0000-0000-0000-00000000000b', 'worker1@test.in', now(), '{"role":"worker","full_name":"Ravi Kumar","preferred_language":"hi"}'),
  ('00000000-0000-0000-0000-00000000000c', 'worker2@test.in', now(), '{"role":"worker","full_name":"Amit Singh"}'),
  ('00000000-0000-0000-0000-00000000000d', 'admin@test.in',   now(), '{"role":"employer","full_name":"Team Admin"}'),
  ('00000000-0000-0000-0000-00000000000e', 'google@test.in',  now(), '{"name":"Google User","role":"admin"}'),
  ('00000000-0000-0000-0000-00000000000f', 'owner2@test.in',  now(), '{"role":"employer","full_name":"Other Owner"}');
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-00000000000d';

do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'worker', 'trigger sets role';
  assert (select preferred_language from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'hi', 'trigger sets language';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000e') is null, 'metadata cannot claim admin/unknown role';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000e') = 'Google User', 'google name fallback';
end $$;
\echo 'ok  signup trigger'

-- ---------------------------------------------------------------- set_my_role
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000e', false);
set role authenticated;
select public.set_my_role('worker');
do $$ begin
  begin
    perform public.set_my_role('employer');
    raise exception 'FAIL: role changed twice';
  exception when others then
    assert sqlerrm = 'role_already_set', sqlerrm;
  end;
  begin
    update public.profiles set is_admin = true where id = auth.uid();
    raise exception 'FAIL: user set is_admin';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'employer' where id = auth.uid();
    raise exception 'FAIL: user changed role directly';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  role chosen once, is_admin/role not writable'

-- ---------------------------------------------------------------- owner: business + jobs
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
insert into public.businesses (owner_id, name, category, address, state, city, pincode, phone)
values (auth.uid(), 'Flavora Cafe', 'cafe', 'Mill Road, Sampurna Nagar', 'Uttar Pradesh', 'Lakhimpur Kheri', '262904', '9876543210');
do $$ begin
  assert (select verification_level from public.businesses where owner_id = auth.uid()) = 'email_verified', 'auto email_verified';
  begin
    update public.businesses set verification_level = 'business_verified' where owner_id = auth.uid();
    raise exception 'FAIL: owner self-verified';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.jobs (business_id, role_id, title, salary_min, salary_max, pay_frequency,
      shift_start, shift_end, weekly_offs, meals, accommodation, employment_type, state, city, status)
    select b.id, 1, 'Tandoor chef', 15000, 20000, 'monthly', '10:00', '22:00', 1, 'two', true,
      'full_time', 'Uttar Pradesh', 'Lakhimpur Kheri', 'open'
    from public.businesses b where b.owner_id = auth.uid();
    raise exception 'FAIL: job without deductions accepted';
  exception when not_null_violation then null;
  end;
  begin
    insert into public.jobs (business_id, role_id, title, salary_min, salary_max, pay_frequency,
      shift_start, shift_end, weekly_offs, meals, accommodation, deductions, employment_type, state, city, status)
    select b.id, 1, 'Tandoor chef', 25000, 20000, 'monthly', '10:00', '22:00', 1, 'two', true,
      'None', 'full_time', 'Uttar Pradesh', 'Lakhimpur Kheri', 'open'
    from public.businesses b where b.owner_id = auth.uid();
    raise exception 'FAIL: salary_max < salary_min accepted';
  exception when check_violation then null;
  end;
end $$;

insert into public.jobs (business_id, role_id, title, salary_min, salary_max, pay_frequency,
  shift_start, shift_end, weekly_offs, meals, accommodation, deductions, employment_type, state, city, status, openings)
select b.id, (select id from public.job_roles where slug = 'tandoor_chef'),
  'Tandoor chef', 18000, 24000, 'monthly', '11:00', '23:00', 1, 'two', true,
  'None', 'full_time', 'Uttar Pradesh', 'Lakhimpur Kheri', 'open', 1
from public.businesses b where b.owner_id = auth.uid();

insert into public.jobs (business_id, role_id, title, salary_min, salary_max, pay_frequency,
  shift_start, shift_end, weekly_offs, meals, accommodation, deductions, employment_type, state, city, status)
select b.id, 11, 'Barista (draft)', 12000, 14000, 'monthly',
  '08:00', '16:00', 1, 'one', false, 'None', 'full_time', 'Uttar Pradesh', 'Lakhimpur Kheri', 'draft'
from public.businesses b where b.owner_id = auth.uid();

-- Clients cannot choose job ids (column not granted). Pin known ids as superuser for the rest of the test.
reset role;
update public.jobs set id = '10000000-0000-0000-0000-000000000001' where title = 'Tandoor chef';
update public.jobs set id = '10000000-0000-0000-0000-000000000002' where title = 'Barista (draft)';
set role authenticated;

do $$ begin
  begin
    update public.jobs set status = 'removed' where id = '10000000-0000-0000-0000-000000000002';
    raise exception 'FAIL: owner removed job';
  exception when others then
    assert sqlerrm = 'only_admin_can_remove', sqlerrm;
  end;
  begin
    update public.jobs set expires_at = now() + interval '365 days' where id = '10000000-0000-0000-0000-000000000002';
    raise exception 'FAIL: owner extended expiry a year';
  exception when insufficient_privilege then null;  -- RLS with-check violation
  end;
end $$;
reset role;
\echo 'ok  business auto-verification, mandatory terms, job guards'

-- ---------------------------------------------------------------- other owner cannot touch Flavora
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
set role authenticated;
do $$
declare n int;
begin
  update public.jobs set salary_min = 1 where id = '10000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: other owner edited job';
  assert (select count(*) from public.jobs where id = '10000000-0000-0000-0000-000000000002') = 0, 'FAIL: other owner sees draft';
end $$;
reset role;
\echo 'ok  owners isolated'

-- ---------------------------------------------------------------- anon
select set_config('request.jwt.claim.sub', '', false);
set role anon;
do $$ begin
  assert (select count(*) from public.jobs) = 1, 'anon sees only the open job';
  assert (select count(*) from public.businesses) = 1, 'anon sees businesses';
  assert (select count(*) from public.job_roles) = 17, 'anon sees taxonomy';
  begin
    perform 1 from public.worker_profiles;
    raise exception 'FAIL: anon read worker_profiles';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  anon read access'

-- ---------------------------------------------------------------- worker1 profile + apply
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
insert into public.worker_profiles (user_id, state, city, primary_role_id, cuisine_ids, total_experience_months, open_to_work)
values (auth.uid(), 'Uttar Pradesh', 'Lakhimpur Kheri', 2, '{1,3}', 48, false);
insert into public.worker_contacts (user_id, phone, email) values (auth.uid(), '9123456789', 'worker1@test.in');
insert into public.employment_history (worker_id, employer_name, role_id, start_date, end_date, reason_for_leaving)
values (auth.uid(), 'Sharma Dhaba', 2, '2022-01-01', '2024-01-01', 'Salary was paid late');
do $$ begin
  begin
    insert into public.employment_history (worker_id, employer_name, start_date, source)
    values (auth.uid(), 'Fake Verified Place', '2020-01-01', 'platform_verified');
    raise exception 'FAIL: worker created verified history';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.applications (job_id, worker_id) values ('10000000-0000-0000-0000-000000000002', auth.uid());
    raise exception 'FAIL: applied to a draft job';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.applications (job_id, worker_id, status) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'hired');
    raise exception 'FAIL: worker set own status';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.businesses (owner_id, name, category, address, state, city, phone)
    values (auth.uid(), 'Worker Biz', 'cafe', 'Some address', 'UP', 'Lucknow', '9999999999');
    raise exception 'FAIL: worker created a business';
  exception when insufficient_privilege then null;
  end;
end $$;
insert into public.applications (job_id, worker_id, cover_note) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'I have 4 years tandoor experience');
do $$ begin
  begin
    insert into public.applications (job_id, worker_id) values ('10000000-0000-0000-0000-000000000001', auth.uid());
    raise exception 'FAIL: duplicate application';
  exception when unique_violation then null;
  end;
  begin
    perform public.set_application_status((select id from public.applications where worker_id = auth.uid()), 'shortlisted');
    raise exception 'FAIL: worker moved own application';
  exception when others then
    assert sqlerrm = 'not_allowed', sqlerrm;
  end;
end $$;
reset role;
\echo 'ok  worker profile, history rules, apply rules'

-- ---------------------------------------------------------------- worker2 cannot see worker1
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.worker_profiles where user_id = '00000000-0000-0000-0000-00000000000b') = 0, 'FAIL: worker sees other worker';
  assert (select count(*) from public.worker_contacts where user_id = '00000000-0000-0000-0000-00000000000b') = 0, 'FAIL: worker sees other contacts';
  assert (select count(*) from public.applications) = 0, 'FAIL: worker sees other applications';
  assert (select count(*) from public.employment_history where worker_id = '00000000-0000-0000-0000-00000000000b') = 0, 'FAIL: worker sees other history';
end $$;
reset role;
\echo 'ok  workers isolated from each other'

-- ---------------------------------------------------------------- other owner cannot see applicant
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000f', false);
set role authenticated;
do $$ begin
  assert (select count(*) from public.worker_profiles where user_id = '00000000-0000-0000-0000-00000000000b') = 0,
    'FAIL: unrelated employer sees a not-open-to-work worker';
  assert (select count(*) from public.applications) = 0, 'FAIL: unrelated employer sees applications';
end $$;
reset role;
\echo 'ok  not-open-to-work worker hidden from unrelated employers'

-- ---------------------------------------------------------------- owner pipeline
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$
declare v_app uuid;
begin
  select id into v_app from public.applications where job_id = '10000000-0000-0000-0000-000000000001';
  assert v_app is not null, 'owner sees application';
  assert (select count(*) from public.worker_profiles where user_id = '00000000-0000-0000-0000-00000000000b') = 1, 'owner sees applicant profile';
  assert (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'Ravi Kumar', 'owner sees applicant name';
  assert (select count(*) from public.employment_history where worker_id = '00000000-0000-0000-0000-00000000000b') = 1, 'owner sees history';
  assert (select count(*) from public.worker_contacts where user_id = '00000000-0000-0000-0000-00000000000b') = 0, 'FAIL: contacts visible before shortlist';

  insert into public.application_notes (application_id, body) values (v_app, 'Strong tandoor skills, ask about notice period');
  perform public.set_application_status(v_app, 'shortlisted');
  assert (select phone from public.worker_contacts where user_id = '00000000-0000-0000-0000-00000000000b') = '9123456789', 'contacts visible after shortlist';

  begin
    perform public.set_application_status(v_app, 'interview');
    raise exception 'FAIL: interview without time';
  exception when others then
    assert sqlerrm = 'interview_time_required', sqlerrm;
  end;
  perform public.set_application_status(v_app, 'interview', now() + interval '1 day', 'Come at 4pm, ask for Nishant');
  perform public.hire_applicant(v_app, 22000, 'monthly', current_date);
  assert (select status from public.applications where id = v_app) = 'hired', 'application hired';
  assert (select status from public.placements where application_id = v_app) = 'pending', 'placement pending';
end $$;
reset role;
\echo 'ok  owner pipeline, notes, contact reveal, hire'

-- ---------------------------------------------------------------- worker1 confirms joining
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
set role authenticated;
do $$
declare v_pl uuid; n int;
begin
  assert (select count(*) from public.application_notes) = 0, 'FAIL: worker sees private notes';
  select id into v_pl from public.placements where worker_id = auth.uid();
  perform public.confirm_joining(v_pl);
  assert (select count(*) from public.employment_history where worker_id = auth.uid() and source = 'platform_verified') = 1, 'verified history created';
  assert (select status from public.jobs where id = '10000000-0000-0000-0000-000000000001') = 'filled', 'job filled and still visible to applicant';

  update public.employment_history set employer_name = 'Edited' where worker_id = auth.uid() and source = 'platform_verified';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: worker edited verified history';
  delete from public.employment_history where worker_id = auth.uid() and source = 'platform_verified';
  get diagnostics n = row_count;
  assert n = 0, 'FAIL: worker deleted verified history';

  begin
    perform public.confirm_joining(v_pl);
    raise exception 'FAIL: confirmed twice';
  exception when others then
    assert sqlerrm = 'placement_not_pending', sqlerrm;
  end;
end $$;
reset role;
\echo 'ok  joining confirmation creates verified history, job filled'

-- ---------------------------------------------------------------- worker2 cannot confirm someone else
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
insert into public.reports (target_type, target_id, reason, details)
values ('job', '10000000-0000-0000-0000-000000000001', 'wrong_terms', 'Salary is lower in reality');
do $$ begin
  begin
    perform public.end_placement((select id from public.placements limit 1), current_date, 'x');
    raise exception 'FAIL: worker2 could see a placement';
  exception when others then
    assert sqlerrm in ('not_allowed'), sqlerrm;  -- placement id is null for worker2 -> not found
  end;
  begin
    perform public.admin_update_report((select id from public.reports limit 1), 'resolved', 'self-resolve');
    raise exception 'FAIL: non-admin resolved report';
  exception when others then
    assert sqlerrm = 'not_allowed', sqlerrm;
  end;
  begin
    insert into public.audit_logs (action, target_type) values ('fake', 'x');
    raise exception 'FAIL: user wrote audit log';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
\echo 'ok  reports, admin RPCs and audit logs protected'

-- ---------------------------------------------------------------- admin
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
set role authenticated;
do $$
declare v_report uuid; v_biz uuid;
begin
  select id into v_report from public.reports limit 1;
  select id into v_biz from public.businesses where name = 'Flavora Cafe';
  perform public.admin_update_report(v_report, 'resolved', 'Called the owner, salary corrected');
  perform public.admin_set_business_verification(v_biz, 'business_verified');
  perform public.admin_set_job_status('10000000-0000-0000-0000-000000000002', 'removed');
  assert (select verification_level from public.businesses where id = v_biz) = 'business_verified', 'admin verified';
  assert (select count(*) from public.audit_logs) >= 5, 'audit rows written';
  assert (select count(*) from public.worker_contacts) >= 1, 'admin sees contacts';
end $$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
do $$ begin
  begin
    update public.jobs set status = 'open' where id = '10000000-0000-0000-0000-000000000002';
    raise exception 'FAIL: owner reopened removed job';
  exception when others then
    assert sqlerrm = 'job_removed_by_admin', sqlerrm;
  end;
end $$;
reset role;
\echo 'ok  admin moderation + audit log, removed jobs locked'

select action, target_type from public.audit_logs order by id;
\echo 'ALL TESTS PASSED'
