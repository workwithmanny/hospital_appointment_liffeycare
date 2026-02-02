-- Core schema and RLS policies.
begin;

\i ../schema.sql

alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.system_logs enable row level security;
alter table public.departments enable row level security;

create policy "self profile read" on public.profiles
for select using (auth.uid() = id);

create policy "self profile insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "self profile update" on public.profiles
for update using (auth.uid() = id);

create policy "admin full profiles" on public.profiles
for all using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);

create policy "patient own appointments" on public.appointments
for select using (auth.uid() = patient_id);

create policy "doctor own appointments" on public.appointments
for select using (auth.uid() = doctor_id);

create policy "patient create own appointments" on public.appointments
for insert with check (auth.uid() = patient_id);

create policy "doctor update own appointments" on public.appointments
for update using (auth.uid() = doctor_id);

commit;
