begin;

-- Appointment session lifecycle, follow-ups, clinical notes
alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('scheduled', 'cancelled', 'completed', 'in_progress'));

alter table public.appointments
  add column if not exists consultation_duration_minutes int not null default 30
    check (consultation_duration_minutes > 0 and consultation_duration_minutes <= 480),
  add column if not exists session_started_at timestamptz,
  add column if not exists session_ends_at timestamptz,
  add column if not exists doctor_joined_at timestamptz,
  add column if not exists patient_joined_at timestamptz,
  add column if not exists clinical_notes jsonb not null default '{}'::jsonb,
  add column if not exists parent_appointment_id uuid references public.appointments(id) on delete set null;

create index if not exists appointments_parent_idx on public.appointments (parent_appointment_id);

-- Doctor wallet
alter table public.profiles
  add column if not exists wallet_balance numeric(12, 2) not null default 0
    check (wallet_balance >= 0);

create table if not exists public.doctor_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount numeric(12, 2) not null,
  entry_type text not null check (entry_type in ('consultation_credit', 'withdrawal', 'adjustment')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.doctor_wallet_ledger enable row level security;

create policy "doctor read own ledger" on public.doctor_wallet_ledger
for select using (auth.uid() = doctor_id);

-- In-app notifications
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_notifications_user_created_idx
  on public.app_notifications (user_id, created_at desc);

alter table public.app_notifications enable row level security;

create policy "read own app notifications" on public.app_notifications
for select using (auth.uid() = user_id);

create policy "update own app notifications" on public.app_notifications
for update using (auth.uid() = user_id);

-- Counterparty may insert a notification for the other party when they share an appointment
create policy "notify appointment counterpart" on public.app_notifications
for insert with check (
  auth.uid() is not null
  and user_id is not null
  and user_id <> auth.uid()
  and exists (
    select 1
    from public.appointments a
    where
      (a.patient_id = user_id and a.doctor_id = auth.uid())
      or (a.doctor_id = user_id and a.patient_id = auth.uid())
  )
);

drop policy if exists "patient update own appointments" on public.appointments;
create policy "patient update own appointments" on public.appointments
for update using (auth.uid() = patient_id)
with check (auth.uid() = patient_id);

create policy "doctor insert withdrawal ledger" on public.doctor_wallet_ledger
for insert with check (
  auth.uid() = doctor_id
  and entry_type = 'withdrawal'
);

create or replace function public.apply_consultation_payout(p_appointment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ap record;
  credit numeric;
begin
  select
    a.id,
    a.patient_id,
    a.doctor_id,
    a.status,
    a.payment_status,
    a.amount_paid,
    coalesce(p.consultation_price, 0::numeric) as doc_price
  into ap
  from public.appointments a
  join public.profiles p on p.id = a.doctor_id
  where a.id = p_appointment_id
  for update of a;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  if auth.uid() is null or auth.uid() not in (ap.patient_id, ap.doctor_id) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if ap.status is distinct from 'completed' then
    return jsonb_build_object('ok', false, 'error', 'not_completed');
  end if;

  if exists (
    select 1
    from public.doctor_wallet_ledger l
    where l.appointment_id = p_appointment_id
      and l.entry_type = 'consultation_credit'
  ) then
    return jsonb_build_object('ok', true, 'skipped', 'already_credited');
  end if;

  if ap.payment_status is distinct from 'paid' then
    return jsonb_build_object('ok', true, 'skipped', 'not_paid');
  end if;

  credit := coalesce(ap.amount_paid, 0);
  if credit <= 0 then
    credit := ap.doc_price;
  end if;
  if credit <= 0 then
    return jsonb_build_object('ok', true, 'skipped', 'zero_amount');
  end if;

  insert into public.doctor_wallet_ledger (doctor_id, appointment_id, amount, entry_type, note)
  values (ap.doctor_id, p_appointment_id, credit, 'consultation_credit', 'Consultation payout');

  update public.profiles
  set wallet_balance = coalesce(wallet_balance, 0::numeric) + credit
  where id = ap.doctor_id;

  return jsonb_build_object('ok', true, 'credited', credit);
end;
$$;

grant execute on function public.apply_consultation_payout(uuid) to authenticated;

commit;
