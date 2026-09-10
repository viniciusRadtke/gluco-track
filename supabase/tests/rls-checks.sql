\set ON_ERROR_STOP on
\set QUIET on
\pset pager off

-- Two accounts, as the administrator would provision them (RF-AUT-05).
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'patient@example.test', '{}',
   '{"role":"patient","full_name":"Paciente"}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'caregiver@example.test', '{}',
   '{"role":"caregiver","full_name":"Cuidadora"}');

\echo '1. profiles created by trigger (expect patient + caregiver):'
select id, role from public.profiles order by role desc;

\echo '2. settings row auto-created for the patient only (expect 1):'
select count(*) from public.patient_settings;

\echo '3. defaults match the requirements (expect 100 150 70 180 130 80):'
select glucose_target_min, glucose_target_max, alert_low, alert_high,
       bp_target_systolic, bp_target_diastolic from public.patient_settings;

-- ---- as the patient -------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

\echo '4. patient inserts a glucose reading (expect 1 row):'
insert into public.glucose_readings (patient_id, value, context)
values ('11111111-1111-1111-1111-111111111111', 142, 'fasting')
returning value, context;

\echo '5. patient reads own readings (expect 1):'
select count(*) from public.glucose_readings;

\echo '6. patient cannot write a reading for someone else (expect failure):'
savepoint s1;
do $$
begin
  insert into public.glucose_readings (patient_id, value)
  values ('22222222-2222-2222-2222-222222222222', 100);
  raise exception 'SECURITY FAILURE: cross-patient insert was allowed';
exception
  when insufficient_privilege then raise notice '   blocked by row level security, as expected';
end;
$$;
rollback to savepoint s1;

-- ---- as the caregiver, before the link ------------------------------------
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

\echo '7. unlinked caregiver sees nothing (expect 0):'
select count(*) from public.glucose_readings;

-- ---- link them, as the administrator would --------------------------------
reset role;
insert into public.patient_access (patient_id, caregiver_id)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

\echo '8. linked caregiver reads the patient readings (expect 1):'
select count(*) from public.glucose_readings;

\echo '9. caregiver cannot write (RF-AUT-06, expect failure):'
savepoint s2;
do $$
begin
  insert into public.glucose_readings (patient_id, value)
  values ('11111111-1111-1111-1111-111111111111', 100);
  raise exception 'SECURITY FAILURE: caregiver insert was allowed';
exception
  when insufficient_privilege then raise notice '   blocked by row level security, as expected';
end;
$$;
rollback to savepoint s2;

\echo '10. caregiver cannot delete (expect 0 rows deleted):'
with removed as (delete from public.glucose_readings returning 1)
select count(*) from removed;

-- ---- anonymous ------------------------------------------------------------
reset role;
set local request.jwt.claim.sub = '';
set local role anon;
\echo '11. anonymous role has no access at all (expect failure):'
savepoint s3;
do $$
begin
  perform 1 from public.glucose_readings;
  raise exception 'SECURITY FAILURE: anon could read glucose_readings';
exception
  when insufficient_privilege then raise notice '   blocked, as expected';
end;
$$;
rollback to savepoint s3;

-- ---- constraints ----------------------------------------------------------
reset role;
\echo '12. out-of-range glucose is rejected (expect failure):'
savepoint s4;
do $$
begin
  insert into public.glucose_readings (patient_id, value)
  values ('11111111-1111-1111-1111-111111111111', 700);
  raise exception 'FAILURE: 700 mg/dL was accepted';
exception
  when check_violation then raise notice '   rejected by the range constraint, as expected';
end;
$$;
rollback to savepoint s4;

\echo '13. inconsistent threshold order is rejected (expect failure):'
savepoint s5;
do $$
begin
  update public.patient_settings set alert_low = 200;
  raise exception 'FAILURE: alert_low above the target range was accepted';
exception
  when check_violation then raise notice '   rejected by the ordering constraint, as expected';
end;
$$;
rollback to savepoint s5;

\echo 'All checks completed.'
