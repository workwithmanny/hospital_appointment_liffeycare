-- Migration: Add wallet and stripe payment support
-- 1. Add wallet_balance and stripe columns to profiles
alter table public.profiles add column if not exists wallet_balance decimal(10,2) default 0;

-- 2. Update payment_method check to include 'stripe'
-- Drop if exists to avoid errors on reapplying
alter table public.appointments drop constraint if exists appointments_payment_method_check;
alter table public.appointments add constraint appointments_payment_method_check check (payment_method in ('pay_at_clinic', 'dummy_online', 'stripe'));

-- 3. Add stripe_transaction_id to appointments
alter table public.appointments add column if not exists stripe_transaction_id text;

-- 4. Create ledger table for wallet history
create table if not exists public.doctor_wallet_ledger (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount decimal(10,2) not null,
  entry_type text not null check (entry_type in ('earning', 'withdrawal')),
  note text,
  created_at timestamptz not null default now()
);

-- Index for performance
create index if not exists idx_doctor_wallet_ledger_doctor_id on public.doctor_wallet_ledger(doctor_id);

-- 5. RLS policies for ledger (optional, as some apps use admin client for wallets)
alter table public.doctor_wallet_ledger enable row level security;

create policy "doctors can view their own ledger"
  on public.doctor_wallet_ledger for select
  using (auth.uid() = doctor_id);
