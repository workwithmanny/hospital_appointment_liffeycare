-- Migration: Add banned status support and admin messaging
-- Date: 2024-03-30

-- Add banned fields to profiles
alter table public.profiles 
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text,
  add column if not exists banned_by uuid references public.profiles(id);

-- Add account_status for more flexibility (active, suspended, banned, pending)
alter table public.profiles 
  add column if not exists account_status text not null default 'active' 
  check (account_status in ('active', 'suspended', 'banned', 'pending_verification'));

-- Create admin_messages table for admin to user communications
create table if not exists public.admin_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  subject text not null,
  message text not null,
  message_type text not null default 'email' check (message_type in ('email', 'sms', 'in_app')),
  is_read boolean not null default false,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

-- Enable RLS on admin_messages
alter table public.admin_messages enable row level security;

-- RLS policies for admin_messages
create policy "admin can send messages" on public.admin_messages
  for insert with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

create policy "users can view their messages" on public.admin_messages
  for select using (
    recipient_id = auth.uid() or 
    sender_id = auth.uid() or
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );

-- Update existing banned users if any
update public.profiles 
  set account_status = 'banned' 
  where is_banned = true and account_status = 'active';

-- Add indexes for performance
create index if not exists idx_profiles_account_status on public.profiles(account_status);
create index if not exists idx_profiles_is_banned on public.profiles(is_banned);
create index if not exists idx_admin_messages_recipient on public.admin_messages(recipient_id);
create index if not exists idx_admin_messages_sent_at on public.admin_messages(sent_at);
