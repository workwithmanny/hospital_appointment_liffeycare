begin;

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references public.appointments(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "message participants read" on public.messages
for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "doctor can send to own appointment patient" on public.messages
for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.appointments a
    where a.id = messages.appointment_id
      and a.doctor_id = auth.uid()
      and a.patient_id = messages.recipient_id
  )
);

create policy "recipient can mark read" on public.messages
for update using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

commit;
