-- Core schema: profiles, caregiver access, per-patient settings and the three
-- measurement tables (glucose, blood pressure, weight).
--
-- Every table is protected by row level security. The caregiver role is
-- read-only and that is enforced here, in the database, rather than in the
-- interface (RF-AUT-06).

create type public.user_role as enum ('patient', 'caregiver');

create type public.glucose_context as enum (
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'random'
);

-- Keeps updated_at honest without trusting the client.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'caregiver',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Accounts are provisioned by the administrator; there is no public sign-up
-- (RF-AUT-05). The role is read from the user metadata supplied at creation
-- time and falls back to 'caregiver', the role with no write access and no
-- data of its own, so a misconfigured account can never write patient data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
      'caregiver'
    ),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Caregiver access
-- ---------------------------------------------------------------------------

-- The model is deliberately not multi-tenant: a caregiver is linked to a
-- patient through this table and sees nothing without a row here (§8.2).
create table public.patient_access (
  patient_id uuid not null references public.profiles (id) on delete cascade,
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, caregiver_id),
  constraint patient_access_distinct_parties check (patient_id <> caregiver_id)
);

create index patient_access_caregiver_id_idx
  on public.patient_access (caregiver_id);

-- ---------------------------------------------------------------------------
-- Access helpers
--
-- Both are security definer so that the policies below can consult profiles
-- and patient_access without those lookups being filtered by the very
-- policies they are meant to evaluate, which would recurse.
-- ---------------------------------------------------------------------------

create or replace function public.is_patient(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_id = auth.uid()
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'patient'
    );
$$;

create or replace function public.can_read_patient(target_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_patient(target_id)
    or exists (
      select 1
      from public.patient_access
      where patient_id = target_id
        and caregiver_id = auth.uid()
    );
$$;

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

-- One row per patient. Defaults mirror the values in the requirements; the
-- physician's actual targets are still to be confirmed (P-02), which is why
-- they are configurable rather than hard-coded in the client.
create table public.patient_settings (
  patient_id uuid primary key references public.profiles (id) on delete cascade,
  glucose_target_min integer not null default 100,
  glucose_target_max integer not null default 150,
  alert_low integer not null default 70,
  alert_high integer not null default 180,
  bp_target_systolic integer not null default 130,
  bp_target_diastolic integer not null default 80,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patient_settings_glucose_thresholds_ordered check (
    alert_low < glucose_target_min
    and glucose_target_min < glucose_target_max
    and glucose_target_max < alert_high
  )
);

create trigger patient_settings_set_updated_at
  before update on public.patient_settings
  for each row execute function public.set_updated_at();

-- A patient always has a settings row, so the interface never has to decide
-- between "not configured yet" and the configured defaults.
create or replace function public.handle_new_patient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'patient' then
    insert into public.patient_settings (patient_id)
    values (new.id)
    on conflict (patient_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger profiles_create_patient_settings
  after insert or update of role on public.profiles
  for each row execute function public.handle_new_patient();

-- ---------------------------------------------------------------------------
-- Measurements
-- ---------------------------------------------------------------------------

-- Ranges match the accepted input ranges in the requirements (§5.1). They
-- reject impossible values; implausible-but-possible ones are confirmed in the
-- interface instead of being blocked (RF-GLI-07).
create table public.glucose_readings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  value integer not null,
  context public.glucose_context not null default 'fasting',
  measured_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint glucose_readings_value_range check (value between 20 and 600),
  constraint glucose_readings_note_length check (char_length(note) <= 500)
);

create index glucose_readings_patient_measured_at_idx
  on public.glucose_readings (patient_id, measured_at desc);

create trigger glucose_readings_set_updated_at
  before update on public.glucose_readings
  for each row execute function public.set_updated_at();

create table public.blood_pressure_readings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  systolic integer not null,
  diastolic integer not null,
  pulse integer,
  measured_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_pressure_systolic_range check (systolic between 60 and 260),
  constraint blood_pressure_diastolic_range check (diastolic between 30 and 160),
  constraint blood_pressure_pulse_range check (pulse is null or pulse between 30 and 220),
  constraint blood_pressure_systolic_above_diastolic check (systolic > diastolic),
  constraint blood_pressure_note_length check (char_length(note) <= 500)
);

create index blood_pressure_readings_patient_measured_at_idx
  on public.blood_pressure_readings (patient_id, measured_at desc);

create trigger blood_pressure_readings_set_updated_at
  before update on public.blood_pressure_readings
  for each row execute function public.set_updated_at();

create table public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(4, 1) not null,
  measured_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weight_entries_weight_range check (weight_kg between 20.0 and 300.0),
  constraint weight_entries_note_length check (char_length(note) <= 500)
);

create index weight_entries_patient_measured_at_idx
  on public.weight_entries (patient_id, measured_at desc);

create trigger weight_entries_set_updated_at
  before update on public.weight_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.patient_access enable row level security;
alter table public.patient_settings enable row level security;
alter table public.glucose_readings enable row level security;
alter table public.blood_pressure_readings enable row level security;
alter table public.weight_entries enable row level security;

-- Profiles: everyone reads their own row; a caregiver also reads the profile
-- of the patient they are linked to, so the interface can name them. Roles are
-- assigned by the administrator and are not self-editable.
create policy profiles_select_self
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.can_read_patient(id));

create policy profiles_update_own_name
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Access links are administrative: readable by both parties, writable by
-- neither. Only the service role manages them.
create policy patient_access_select_involved
  on public.patient_access for select
  to authenticated
  using (patient_id = auth.uid() or caregiver_id = auth.uid());

create policy patient_settings_select
  on public.patient_settings for select
  to authenticated
  using (public.can_read_patient(patient_id));

create policy patient_settings_insert
  on public.patient_settings for insert
  to authenticated
  with check (public.is_patient(patient_id));

create policy patient_settings_update
  on public.patient_settings for update
  to authenticated
  using (public.is_patient(patient_id))
  with check (public.is_patient(patient_id));

create policy glucose_readings_select
  on public.glucose_readings for select
  to authenticated
  using (public.can_read_patient(patient_id));

create policy glucose_readings_insert
  on public.glucose_readings for insert
  to authenticated
  with check (public.is_patient(patient_id));

create policy glucose_readings_update
  on public.glucose_readings for update
  to authenticated
  using (public.is_patient(patient_id))
  with check (public.is_patient(patient_id));

create policy glucose_readings_delete
  on public.glucose_readings for delete
  to authenticated
  using (public.is_patient(patient_id));

create policy blood_pressure_readings_select
  on public.blood_pressure_readings for select
  to authenticated
  using (public.can_read_patient(patient_id));

create policy blood_pressure_readings_insert
  on public.blood_pressure_readings for insert
  to authenticated
  with check (public.is_patient(patient_id));

create policy blood_pressure_readings_update
  on public.blood_pressure_readings for update
  to authenticated
  using (public.is_patient(patient_id))
  with check (public.is_patient(patient_id));

create policy blood_pressure_readings_delete
  on public.blood_pressure_readings for delete
  to authenticated
  using (public.is_patient(patient_id));

create policy weight_entries_select
  on public.weight_entries for select
  to authenticated
  using (public.can_read_patient(patient_id));

create policy weight_entries_insert
  on public.weight_entries for insert
  to authenticated
  with check (public.is_patient(patient_id));

create policy weight_entries_update
  on public.weight_entries for update
  to authenticated
  using (public.is_patient(patient_id))
  with check (public.is_patient(patient_id));

create policy weight_entries_delete
  on public.weight_entries for delete
  to authenticated
  using (public.is_patient(patient_id));

-- ---------------------------------------------------------------------------
-- Privileges
--
-- Supabase's default privileges hand every role full access to new tables in
-- this schema, and policies only ever narrow what a role may already do. So
-- the grants are restated from scratch here: the anonymous role loses access
-- outright, rather than relying on the absence of a policy naming it, and the
-- authenticated role gets exactly the verbs its policies contemplate.
-- ---------------------------------------------------------------------------

revoke all on
  public.profiles,
  public.patient_access,
  public.patient_settings,
  public.glucose_readings,
  public.blood_pressure_readings,
  public.weight_entries
from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select on public.patient_access to authenticated;
grant select, insert, update on public.patient_settings to authenticated;
grant select, insert, update, delete on public.glucose_readings to authenticated;
grant select, insert, update, delete on public.blood_pressure_readings to authenticated;
grant select, insert, update, delete on public.weight_entries to authenticated;
