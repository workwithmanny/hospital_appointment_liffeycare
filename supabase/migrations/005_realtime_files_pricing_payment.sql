begin;

alter table public.profiles
  add column if not exists consultation_price numeric(10, 2) not null default 0;

alter table public.appointments
  add column if not exists payment_method text not null default 'pay_at_clinic'
    check (payment_method in ('pay_at_clinic', 'dummy_online')),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid')),
  add column if not exists amount_paid numeric(10, 2) not null default 0;

create table if not exists public.message_attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references public.messages(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  mime_type text,
  created_at timestamptz not null default now()
);

alter table public.message_attachments enable row level security;

drop policy if exists "doctor can send to own appointment patient" on public.messages;

create policy "appointment participant can send message" on public.messages
for insert with check (
  auth.uid() = sender_id
  and (
    exists (
      select 1 from public.appointments a
      where a.id = messages.appointment_id
        and a.doctor_id = auth.uid()
        and a.patient_id = messages.recipient_id
    )
    or
    exists (
      select 1 from public.appointments a
      where a.id = messages.appointment_id
        and a.patient_id = auth.uid()
        and a.doctor_id = messages.recipient_id
    )
  )
);

create policy "attachment participants read" on public.message_attachments
for select using (
  exists (
    select 1
    from public.messages m
    where m.id = message_attachments.message_id
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
  )
);

create policy "attachment participants insert" on public.message_attachments
for insert with check (
  exists (
    select 1
    from public.messages m
    where m.id = message_attachments.message_id
      and (m.sender_id = auth.uid() or m.recipient_id = auth.uid())
  )
);

commit;
