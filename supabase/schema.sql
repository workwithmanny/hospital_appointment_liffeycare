create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'doctor', 'admin')),
  full_name text not null,
  phone text,
  avatar_url text,
  doctor_approved boolean not null default false,
  consultation_price decimal(10,2),
  specialty text,
  age int check (age is null or (age >= 0 and age <= 130)),
  allergies text[],
  hospital text,
  certification text,
  gender text check (gender is null or gender in ('male','female','other','prefer_not_say')),
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  reviews_count int check (reviews_count is null or reviews_count >= 0),
  is_online boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

create table if not exists public.doctor_availability (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  break_start time,
  break_end time
);

create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  slot_time timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
  session_notes text,
  payment_method text check (payment_method in ('pay_at_clinic', 'dummy_online')),
  payment_status text check (payment_status in ('pending', 'paid', 'refunded')) default 'pending',
  amount_paid decimal(10,2) default 0,
  cancellation_reason text,
  cancelled_by uuid references public.profiles(id),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (doctor_id, slot_time)
);

create table if not exists public.system_logs (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, doctor_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'patient'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    case when coalesce(new.raw_user_meta_data ->> 'role', 'patient') = 'doctor' then false else true end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
