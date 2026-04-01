-- Add has_completed_onboarding flag to profiles table
-- This tracks whether the user has seen/dismissed the first-time onboarding banner

alter table public.profiles add column if not exists has_completed_onboarding boolean not null default false;

-- Update the schema.sql to include this field for new setups
-- Note: The application will set this to true when user dismisses or clicks the banner
