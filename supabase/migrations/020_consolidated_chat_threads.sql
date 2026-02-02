begin;

-- Create conversation_threads table for unified chat model
create table if not exists public.conversation_threads (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(patient_id, doctor_id)
);

-- Add new columns to messages table for thread linking and appointment context
alter table public.messages 
add column if not exists thread_id uuid references public.conversation_threads(id) on delete set null,
add column if not exists appointment_context_id uuid references public.appointments(id) on delete set null;

-- Enable RLS on conversation_threads
alter table public.conversation_threads enable row level security;

-- Create policies for conversation_threads
create policy "thread participants read" on public.conversation_threads
for select using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);

create policy "patient can create thread with doctor" on public.conversation_threads
for insert with check (
  auth.uid() = patient_id
  and exists (
    select 1 from public.profiles p 
    where p.id = doctor_id 
    and p.role = 'doctor' 
    and p.doctor_approved = true
  )
);

create policy "doctor can create thread with patient" on public.conversation_threads
for insert with check (
  auth.uid() = doctor_id
  and exists (
    select 1 from public.profiles p 
    where p.id = patient_id 
    and p.role = 'patient'
  )
);

create policy "thread participants update" on public.conversation_threads
for update using (
  auth.uid() = patient_id or auth.uid() = doctor_id
);

-- Update messages policies to work with threads
create policy "message thread participants read" on public.messages
for select using (
  auth.uid() = sender_id 
  or auth.uid() = recipient_id
  or exists (
    select 1 from public.conversation_threads ct
    where ct.id = messages.thread_id
    and (auth.uid() = ct.patient_id or auth.uid() = ct.doctor_id)
  )
);

create policy "thread participants can send messages" on public.messages
for insert with check (
  auth.uid() = sender_id
  and (
    -- Direct messages (thread_id is not null, appointment_context_id is null)
    (thread_id is not null and appointment_context_id is null and exists (
      select 1 from public.conversation_threads ct
      where ct.id = thread_id
      and (auth.uid() = ct.patient_id or auth.uid() = ct.doctor_id)
      and (
        -- Sender is patient and recipient is doctor
        (auth.uid() = ct.patient_id and recipient_id = ct.doctor_id)
        -- or sender is doctor and recipient is patient
        or (auth.uid() = ct.doctor_id and recipient_id = ct.patient_id)
      )
    ))
    -- or appointment messages (legacy support)
    or (thread_id is null and appointment_context_id is not null and exists (
      select 1 from public.appointments a
      where a.id = appointment_context_id
      and (
        -- Doctor sending to patient in appointment
        (auth.uid() = a.doctor_id and recipient_id = a.patient_id)
        -- or patient sending to doctor in appointment
        or (auth.uid() = a.patient_id and recipient_id = a.doctor_id)
      )
    ))
  )
);

-- Create index for performance
create index if not exists idx_conversation_threads_patient_doctor 
  on public.conversation_threads(patient_id, doctor_id);

create index if not exists idx_messages_thread_id 
  on public.messages(thread_id);

create index if not exists idx_messages_appointment_context_id 
  on public.messages(appointment_context_id);

-- Create function to automatically update updated_at timestamp
create or replace function public.update_conversation_thread_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_threads 
  set updated_at = now() 
  where id = new.thread_id;
  return new;
end;
$$;

-- Create trigger to update thread timestamp when message is sent
drop trigger if exists update_thread_timestamp on public.messages;
create trigger update_thread_timestamp
  after insert on public.messages
  for each row
  execute function public.update_conversation_thread_updated_at();

commit;
